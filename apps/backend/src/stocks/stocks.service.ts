import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockVoucherDto } from './dto/create-stock-voucher.dto';
import {
  StockVoucherType,
  InventoryListQuery,
  InventoryListResponse,
  InventoryProductDto,
} from '@repo/shared';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async createVoucher(dto: CreateStockVoucherDto) {
    return this.prisma.$transaction(async (tx) => {
      const voucherNumber = await this.generateVoucherNumber(tx, dto.type);

      let grossTotal = 0;
      let discountTotal = 0;
      let taxTotal = 0;
      let netTotal = 0;

      const voucher = await tx.stockVoucher.create({
        data: {
          voucherNumber,
          type: dto.type,
          supplierId: dto.supplierId ?? null,
          date: new Date(dto.voucherDate),
          remarks: dto.remarks,
        },
      });

      const mergedItems = this.mergeDuplicateItems(dto.items);

      for (const item of mergedItems) {
        const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;

        this.validateVoucherItemAmounts(item);

        const batch = await this.resolveBatch(
          tx,
          item,
          dto.type,
          dto.supplierId,
          expiryDate,
        );

        await this.createStockVoucherItem(tx, voucher.id, batch.id, item);

        grossTotal += item.grossAmount;
        discountTotal += item.discountAmount ?? 0;
        taxTotal += item.taxAmount ?? 0;
        netTotal += item.netAmount;
      }

      return this.updateVoucherTotals(
        tx,
        voucher.id,
        grossTotal,
        discountTotal,
        taxTotal,
        netTotal,
      );
    });
  }

  async findAll(params?: { skip?: number; take?: number }) {
    const vouchers = await this.prisma.stockVoucher.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        voucherNumber: true,
        type: true,
        date: true,
        supplierId: true,
        grossAmount: true,
        discountAmount: true,
        taxAmount: true,
        netAmount: true,
        supplier: {
          select: { name: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip: params?.skip,
      take: params?.take ?? 100,
    });

    // Convert Decimal -> number, flatten supplier.name -> supplierName,
    // flatten _count.items -> itemCount, once, so every consumer (frontend
    // list table, search, etc.) gets clean, ready-to-use data.
    return vouchers.map((v) => ({
      id: v.id,
      voucherNumber: v.voucherNumber,
      type: v.type,
      date: v.date,
      supplierId: v.supplierId,
      supplierName: v.supplier?.name ?? null,
      itemCount: v._count.items,
      grossAmount: Number(v.grossAmount),
      discountAmount: Number(v.discountAmount),
      taxAmount: Number(v.taxAmount),
      netAmount: Number(v.netAmount),
    }));
  }

  async findOne(id: string) {
    const voucher = await this.prisma.stockVoucher.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplier: true,
        items: {
          include: {
            batch: true,
            product: true,
          },
        },
      },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher ${id} not found`);
    }

    return {
      ...voucher,
      grossAmount: Number(voucher.grossAmount),
      discountAmount: Number(voucher.discountAmount),
      taxAmount: Number(voucher.taxAmount),
      netAmount: Number(voucher.netAmount),
      items: voucher.items.map((item) => ({
        ...item,
        purchaseRate: Number(item.purchaseRate),
        saleRate: Number(item.saleRate),
        grossAmount: Number(item.grossAmount),
        discountAmount: Number(item.discountAmount),
        taxAmount: Number(item.taxAmount),
        netAmount: Number(item.netAmount),
        batch: {
          ...item.batch,
          purchaseRate: Number(item.batch.purchaseRate),
          saleRate: Number(item.batch.saleRate),
        },
      })),
    };
  }

  async getProductStock(productId: string) {
    const batches = await this.prisma.batch.findMany({
      where: {
        productId,
        deletedAt: null,
        currentQuantity: {
          gt: 0,
        },
      },
      include: {
        // needed for packingSize — POS uses this to compute the per-unit
        // (loose) rate and to know how many loose units one pack breaks into
        product: {
          select: {
            packingSize: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc', // FEFO
      },
    });

    const mappedBatches = batches.map((b) => ({
      batchId: b.id,
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate,
      currentQuantity: b.currentQuantity,
      looseQuantity: b.looseQuantity,
      packingSize: Number(b.product.packingSize),
      purchaseRate: Number(b.purchaseRate),
      saleRate: Number(b.saleRate),
    }));

    return {
      productId,
      totalQuantity: mappedBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0,
      ),
      batches: mappedBatches,
    };
  }

  async softDelete(id: string) {
    const voucher = await this.prisma.stockVoucher.findFirst({
      where: { id, deletedAt: null },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher ${id} not found`);
    }

    return this.prisma.stockVoucher.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async generateVoucherNumber(
    tx: any,
    type: StockVoucherType,
  ): Promise<string> {
    const dateKey = this.formatDateKey(new Date());

    const prefixMap: Record<StockVoucherType, string> = {
      [StockVoucherType.OPENING]: 'OP',
      [StockVoucherType.PURCHASE]: 'PU',
      [StockVoucherType.PURCHASE_RETURN]: 'PR',
      [StockVoucherType.STOCK_ADJUSTMENT]: 'SA',
      [StockVoucherType.STOCK_TRANSFER]: 'ST',
    };

    const counter = await tx.stockVoucherNumberCounter.upsert({
      where: { type_dateKey: { type, dateKey } },
      create: { type, dateKey, seq: 1 },
      update: { seq: { increment: 1 } },
    });

    const seq = String(counter.seq).padStart(4, '0');

    return `${prefixMap[type]}-${dateKey}-${seq}`;
  }
  private formatDateKey(date: Date): string {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }

  private mergeDuplicateItems(items: any[]): any[] {
    const grouped = new Map<string, any>();

    for (const item of items) {
      const key = `${item.productId}|${item.batchNumber}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, { ...item });
        continue;
      }

      // Rates must match for duplicates to be merged
      if (
        Number(existing.purchaseRate) !== Number(item.purchaseRate) ||
        Number(existing.saleRate) !== Number(item.saleRate)
      ) {
        throw new BadRequestException(
          `Conflicting rate for the same product/batch in one voucher (batch ${item.batchNumber})`,
        );
      }

      existing.quantity += item.quantity;
      existing.freeQuantity =
        (existing.freeQuantity ?? 0) + (item.freeQuantity ?? 0);
      existing.grossAmount += item.grossAmount;
      existing.netAmount += item.netAmount;
      existing.discountAmount =
        (existing.discountAmount ?? 0) + (item.discountAmount ?? 0);
      existing.taxAmount = (existing.taxAmount ?? 0) + (item.taxAmount ?? 0);
    }

    return Array.from(grouped.values());
  }

  private validateVoucherItemAmounts(item: any): void {
    // Prevent negative quantities and rates
    if (item.quantity < 0) {
      throw new BadRequestException(
        `Quantity must be non-negative for batch ${item.batchNumber}`,
      );
    }
    if ((item.freeQuantity ?? 0) < 0) {
      throw new BadRequestException(
        `Free quantity must be non-negative for batch ${item.batchNumber}`,
      );
    }
    if (item.purchaseRate < 0) {
      throw new BadRequestException(
        `Purchase rate must be non-negative for batch ${item.batchNumber}`,
      );
    }

    // Validate gross amount = quantity * purchaseRate with rounding tolerance
    const expectedGross = this.round2(item.quantity * item.purchaseRate);
    if (Math.abs(expectedGross - item.grossAmount) > 0.01) {
      throw new BadRequestException(
        `Gross amount mismatch for batch ${item.batchNumber}: expected ${expectedGross}, got ${item.grossAmount}`,
      );
    }
  }

  private async resolveBatch(
    tx: any,
    item: any,
    voucherType: StockVoucherType,
    supplierId: string | null | undefined,
    expiryDate: Date | null,
  ): Promise<any> {
    let batch = await tx.batch.findFirst({
      where: {
        productId: item.productId,
        batchNumber: item.batchNumber,
        expiryDate,
        deletedAt: null,
      },
    });

    if (!batch) {
      batch = await tx.batch.create({
        data: {
          productId: item.productId,
          supplierId: supplierId ?? undefined,
          batchNumber: item.batchNumber,
          expiryDate,
          purchaseRate: item.purchaseRate,
          saleRate: item.saleRate,
          openingQuantity:
            voucherType === StockVoucherType.OPENING
              ? item.quantity + (item.freeQuantity ?? 0)
              : 0,
          currentQuantity: item.quantity + (item.freeQuantity ?? 0),
        },
      });
    } else {
      const rateChanged =
        Number(batch.purchaseRate) !== Number(item.purchaseRate) ||
        Number(batch.saleRate) !== Number(item.saleRate);

      if (rateChanged && !item.confirmRateUpdate) {
        throw new BadRequestException({
          message: `Batch ${item.batchNumber} already exists at different rates.`,
          code: 'BATCH_RATE_MISMATCH',
          batchNumber: item.batchNumber,
          productId: item.productId,
          existingPurchaseRate: Number(batch.purchaseRate),
          existingSaleRate: Number(batch.saleRate),
        });
      }

      if (rateChanged) {
        await tx.batchRateHistory.create({
          data: {
            batchId: batch.id,
            oldPurchaseRate: batch.purchaseRate,
            oldSaleRate: batch.saleRate,
            newPurchaseRate: item.purchaseRate,
            newSaleRate: item.saleRate,
            changedAt: new Date(),
          },
        });
      }

      await tx.batch.update({
        where: {
          id: batch.id,
        },
        data: {
          currentQuantity: {
            increment: item.quantity + (item.freeQuantity ?? 0),
          },
          ...(rateChanged && {
            purchaseRate: item.purchaseRate,
            saleRate: item.saleRate,
          }),
        },
      });

      batch = {
        ...batch,
        currentQuantity:
          batch.currentQuantity + item.quantity + (item.freeQuantity ?? 0),
        ...(rateChanged && {
          purchaseRate: item.purchaseRate,
          saleRate: item.saleRate,
        }),
      };
    }
    return batch;
  }

  private async createStockVoucherItem(
    tx: any,
    voucherId: string,
    batchId: string,
    item: any,
  ): Promise<void> {
    await tx.stockVoucherItem.create({
      data: {
        voucherId,
        productId: item.productId,
        batchId,
        purchaseRate: item.purchaseRate,
        saleRate: item.saleRate,
        quantity: item.quantity,
        freeQuantity: item.freeQuantity ?? 0,
        grossAmount: item.grossAmount,
        discountPercent: item.discountPercent ?? null,
        discountAmount: item.discountAmount ?? 0,
        taxPercent: item.taxPercent ?? null,
        taxAmount: item.taxAmount ?? 0,
        netAmount: item.netAmount,
      },
    });
  }

  private async updateVoucherTotals(
    tx: any,
    voucherId: string,
    grossTotal: number,
    discountTotal: number,
    taxTotal: number,
    netTotal: number,
  ): Promise<any> {
    return tx.stockVoucher.update({
      where: {
        id: voucherId,
      },
      data: {
        grossAmount: grossTotal,
        discountAmount: discountTotal,
        taxAmount: taxTotal,
        netAmount: netTotal,
      },
      include: {
        supplier: true,
        items: {
          include: {
            batch: true,
            product: true,
          },
        },
      },
    });
  }

  private round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }

  async getInventoryList(
    query: InventoryListQuery,
  ): Promise<InventoryListResponse> {
    const {
      search,
      lowStockOnly,
      outOfStockOnly,
      nearExpiryOnly,
      groupId,
      typeId,
      sortBy = 'name',
      sortDir = 'asc',
      page = 1,
      pageSize = 20,
    } = query;

    const now = new Date();
    const expiryThreshold = new Date(now);
    expiryThreshold.setDate(expiryThreshold.getDate() + 30);

    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(groupId && { groupId }),
        ...(typeId && { typeId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        batches: {
          where: { deletedAt: null },
          orderBy: { expiryDate: 'asc' }, // nulls sort last by default in Prisma/Postgres asc
        },
        group: {
          select: { name: true },
        },
        generic: {
          select: { name: true },
        },
      },
    });

    let mapped: InventoryProductDto[] = products.map((p) => {
      const totalQuantity = p.batches.reduce(
        (sum, b) => sum + b.currentQuantity,
        0,
      );
      const nearestBatch = p.batches.find((b) => b.currentQuantity > 0);
      const hasNearExpiryBatch = p.batches.some(
        (b) =>
          b.currentQuantity > 0 &&
          b.expiryDate !== null &&
          b.expiryDate <= expiryThreshold &&
          b.expiryDate >= now,
      );

      return {
        productId: p.id,
        code: p.code,
        barcode: p.barcode,
        name: p.name,
        shelfNo: p.shelfNo,
        groupName: p.group?.name ?? null,
        genericName: p.generic?.name ?? null,
        totalQuantity,
        retailRate: p.retailRate ? Number(p.retailRate) : null,
        minimumStock: p.minimumStock,
        isLowStock: totalQuantity > 0 && totalQuantity <= p.minimumStock,
        isOutOfStock: totalQuantity === 0,
        nearestExpiryDate: nearestBatch?.expiryDate
          ? nearestBatch.expiryDate.toISOString()
          : null,
        hasNearExpiryBatch,
        batches: p.batches.map((b) => ({
          batchId: b.id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate ? b.expiryDate.toISOString() : null,
          currentQuantity: b.currentQuantity,
          purchaseRate: b.purchaseRate ? Number(b.purchaseRate) : null,
          saleRate: b.saleRate ? Number(b.saleRate) : null,
        })),
      };
    });

    if (lowStockOnly) {
      mapped = mapped.filter((p) => p.isLowStock);
    }

    if (outOfStockOnly) {
      mapped = mapped.filter((p) => p.isOutOfStock);
    }

    if (nearExpiryOnly) {
      mapped = mapped.filter((p) => p.hasNearExpiryBatch);
    }

    // Sort by requested field. Using .sort() on the in-memory `mapped` array
    // (post low-stock/near-expiry filtering) rather than a Prisma orderBy,
    // since totalQuantity and isLowStock are computed, not stored columns.
    mapped.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'totalQuantity':
          return (a.totalQuantity - b.totalQuantity) * dir;
        case 'retailRate':
          return ((a.retailRate ?? 0) - (b.retailRate ?? 0)) * dir;
        case 'nearestExpiryDate':
          return (
            ((a.nearestExpiryDate ?? '') > (b.nearestExpiryDate ?? '')
              ? 1
              : -1) * dir
          );
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });

    const total = mapped.length;

    const totalQuantitySum = mapped.reduce(
      (sum, p) => sum + p.totalQuantity,
      0,
    );
    const totalStockValue = mapped.reduce(
      (sum, p) => sum + p.totalQuantity * (p.retailRate ?? 0),
      0,
    );

    const start = (Number(page) - 1) * Number(pageSize);
    const items = mapped.slice(start, start + Number(pageSize));

    return {
      items,
      total,
      page,
      pageSize,
      totalQuantitySum,
      totalStockValue,
    };
  }
}
