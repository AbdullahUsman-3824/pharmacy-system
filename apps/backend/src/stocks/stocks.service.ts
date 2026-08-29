import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CreateStockVoucherDto } from './dto/create-stock-voucher.dto';
import {
  StockVoucherType,
  InventoryProductDto,
  CreatePaymentDto,
  StockVoucherListQuery,
  StockVoucherSortField,
  StockVoucherListResponse,
  InventoryListQuery,
  InventoryListResponse,
  InventorySortField,
  InventoryStatus,
  StockVoucherItemInput,
  StockVoucherOutput,
  ProductStockView,
} from '@repo/shared';
import { buildPagination, withOrder } from '../common/pagination.helper';

export interface InventoryRow {
  id: string;
  code: string;
  barcode: string | null;
  name: string;
  shelfNo: number | null;
  retailRate: Prisma.Decimal | null;
  minimumStock: number;
  group_name: string | null;
  generic_name: string | null;
  total_quantity: bigint;
  nearest_expiry_date: Date | null;
  has_near_expiry: boolean;
  batch_count: number;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------
  //   Stock Vouchers
  // -----------------------

  async createVoucher(dto: CreateStockVoucherDto) {
    return this.prisma.$transaction(async (tx) => {
      const voucherNumber = await this.generateVoucherNumber(tx, dto.type);

      let grossTotal = 0;
      let discountTotal = 0;
      let taxTotal = 0;
      let netTotal = 0;

      await this.validateSupplier(tx, dto);

      const voucher = await tx.stockVoucher.create({
        data: {
          voucherNumber,
          type: dto.type,
          supplierId: dto.supplierId,
          date: new Date(dto.voucherDate),
          remarks: dto.remarks,
        },
      });

      const mergedItems = this.mergeDuplicateItems(dto.items);
      const packingSizeMap = await this.getPackingSizeMap(tx, [
        ...new Set(mergedItems.map((i) => i.productId)),
      ]);

      for (const item of mergedItems) {
        const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
        const packingSize = packingSizeMap.get(item.productId)!;
        const unitQuantity =
          item.packQuantity * packingSize + item.looseQuantity;

        this.validateVoucherItemAmounts(item, packingSize);

        const batch = await this.resolveBatch(
          tx,
          item,
          dto.type,
          expiryDate,
          unitQuantity,
          packingSize,
        );

        await this.createStockVoucherItem(tx, voucher.id, batch.id, item);

        grossTotal += item.grossAmount;
        discountTotal += item.discountAmount ?? 0;
        taxTotal += item.taxAmount ?? 0;
        netTotal += item.netAmount;
      }

      await this.updateVoucherTotals(
        tx,
        voucher.id,
        grossTotal,
        discountTotal,
        taxTotal,
        netTotal,
      );

      await this.createPayments(tx, voucher.id, netTotal, dto.payments);

      const fullVoucher = await tx.stockVoucher.findUnique({
        where: { id: voucher.id },
        include: this.voucherIncludeShape,
      });
      return this.mapVoucherToDto(fullVoucher);
    });
  }

  stockVoucherSortFieldMap: Record<StockVoucherSortField, object> = {
    [StockVoucherSortField.DATE]: { date: undefined },
    [StockVoucherSortField.VOUCHER_NUMBER]: { voucherNumber: undefined },
    [StockVoucherSortField.NET_AMOUNT]: { netAmount: undefined },
  };
  async findAllVouchers(
    query?: StockVoucherListQuery,
  ): Promise<StockVoucherListResponse> {
    const { skip, take, page, pageSize } = buildPagination(query ?? {});
    const search = query?.search?.trim();
    const isSearching = !!search && search.length >= 2;

    const where: Prisma.StockVoucherWhereInput = {
      deletedAt: null,
      ...(isSearching && {
        OR: [
          { voucherNumber: { contains: search, mode: 'insensitive' } },
          { supplier: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(query?.types?.length && { type: { in: query.types } }),
    };

    const orderShape =
      this.stockVoucherSortFieldMap[
        query?.sortBy ?? StockVoucherSortField.DATE
      ];
    const orderBy = withOrder(orderShape, query?.sortOrder ?? 'desc');

    const [vouchers, total] = await this.prisma.$transaction([
      this.prisma.stockVoucher.findMany({
        where,
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
          supplier: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy,
        skip,
        take,
      }),
      this.prisma.stockVoucher.count({ where }),
    ]);

    return {
      data: vouchers.map((v) => ({
        id: v.id,
        voucherNumber: v.voucherNumber,
        type: v.type as unknown as StockVoucherType,
        date: v.date.toISOString(),
        supplierId: v.supplierId,
        supplierName: v.supplier?.name ?? null,
        itemCount: v._count.items,
        grossAmount: Number(v.grossAmount),
        discountAmount: Number(v.discountAmount),
        taxAmount: Number(v.taxAmount),
        netAmount: Number(v.netAmount),
      })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOneVoucher(id: string): Promise<StockVoucherOutput> {
    const voucher = await this.prisma.stockVoucher.findFirst({
      where: { id, deletedAt: null },
      include: this.voucherIncludeShape,
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher ${id} not found`);
    }

    return this.mapVoucherToDto(voucher);
  }

  async getProductStock(productId: string): Promise<ProductStockView> {
    const batches = await this.prisma.batch.findMany({
      where: {
        productId,
        deletedAt: null,
        currentQuantity: {
          gt: 0,
        },
      },
      include: {
        product: {
          select: {
            packingSize: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    const mappedBatches = batches.map((b) => ({
      batchId: b.id,
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate ? b.expiryDate.toISOString() : null,
      currentQuantity: b.currentQuantity,
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

  // -----------------------
  //        Inventory
  // -----------------------

  inventorySortColumnMap: Record<InventorySortField, Prisma.Sql> = {
    [InventorySortField.PRODUCT_NAME]: Prisma.sql`name`,
    [InventorySortField.QUANTITY]: Prisma.sql`total_quantity`,
    [InventorySortField.RETAIL_RATE]: Prisma.sql`"retailRate"`,
    [InventorySortField.EXPIRY_DATE]: Prisma.sql`nearest_expiry_date`,
  };
  async getInventoryList(
    query: InventoryListQuery,
  ): Promise<InventoryListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const now = new Date();
    const expiryThreshold = new Date(now);
    expiryThreshold.setDate(expiryThreshold.getDate() + 30);

    const search = query.search?.trim();
    const isSearching = !!search && search.length >= 2;

    const productConditions: Prisma.Sql[] = [Prisma.sql`p."deletedAt" IS NULL`];
    if (isSearching) {
      productConditions.push(Prisma.sql`(
      p.name ILIKE ${'%' + search + '%'}
      OR p.code ILIKE ${'%' + search + '%'}
      OR p.barcode ILIKE ${'%' + search + '%'}
    )`);
    }
    const productWhere = Prisma.join(productConditions, ' AND ');

    const statusConditions: Prisma.Sql[] = [];
    if (query.status?.length) {
      for (const s of query.status) {
        if (s === InventoryStatus.LOW_STOCK) {
          statusConditions.push(
            Prisma.sql`(ba.total_quantity > 0 AND ba.total_quantity <= p."minimumStock")`,
          );
        } else if (s === InventoryStatus.OUT_OF_STOCK) {
          statusConditions.push(Prisma.sql`(ba.total_quantity = 0)`);
        } else if (s === InventoryStatus.NEAR_EXPIRY) {
          statusConditions.push(Prisma.sql`(ba.has_near_expiry)`);
        }
      }
    }
    const statusWhere = statusConditions.length
      ? Prisma.sql`AND (${Prisma.join(statusConditions, ' OR ')})`
      : Prisma.empty;

    const sortColumn =
      this.inventorySortColumnMap[
        query.sortBy ?? InventorySortField.PRODUCT_NAME
      ];
    const sortDir =
      query.sortOrder === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;

    const baseCte = Prisma.sql`
    WITH batch_agg AS (
      SELECT
        b."productId",
        SUM(b."currentQuantity") AS total_quantity,
        COUNT(*) FILTER (WHERE b."currentQuantity" > 0)::int AS batch_count,
        MIN(b."expiryDate") FILTER (WHERE b."currentQuantity" > 0) AS nearest_expiry_date,
        BOOL_OR(
          b."currentQuantity" > 0
          AND b."expiryDate" IS NOT NULL
          AND b."expiryDate" <= ${expiryThreshold}
          AND b."expiryDate" >= ${now}
        ) AS has_near_expiry
      FROM "Batch" b
      WHERE b."deletedAt" IS NULL
      GROUP BY b."productId"
    ),
    filtered AS (
      SELECT
        p.id, p.code, p.barcode, p.name, p."shelfNo", p."retailRate", p."minimumStock",
        g.name AS group_name, gen.name AS generic_name,
        ba.total_quantity, ba.batch_count, ba.nearest_expiry_date, ba.has_near_expiry
      FROM "Product" p
      INNER JOIN batch_agg ba ON ba."productId" = p.id
      LEFT JOIN "ProductGroup" g ON g.id = p."groupId"
      LEFT JOIN "Generic" gen ON gen.id = p."genericId"
      WHERE ${productWhere}
      ${statusWhere}
    )
  `;

    const [rows, countResult, summaryResult] = await Promise.all([
      this.prisma.$queryRaw<InventoryRow[]>`
      ${baseCte}
      SELECT * FROM filtered
      ORDER BY ${sortColumn} ${sortDir} NULLS LAST
      LIMIT ${pageSize} OFFSET ${skip}
    `,
      this.prisma.$queryRaw<{ count: bigint }[]>`
      ${baseCte}
      SELECT COUNT(*)::bigint AS count FROM filtered
    `,
      this.prisma.$queryRaw<
        { qty_sum: bigint | null; value_sum: number | null }[]
      >`
      ${baseCte}
      SELECT
        SUM(total_quantity)::bigint AS qty_sum,
        SUM(total_quantity * COALESCE("retailRate", 0))::float AS value_sum
      FROM filtered
    `,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    const data: InventoryProductDto[] = rows.map((r) => {
      const totalQuantity = Number(r.total_quantity);
      return {
        productId: r.id,
        code: r.code,
        barcode: r.barcode,
        name: r.name,
        shelfNo: r.shelfNo,
        groupName: r.group_name,
        genericName: r.generic_name,
        totalQuantity,
        retailRate: r.retailRate !== null ? Number(r.retailRate) : null,
        minimumStock: r.minimumStock,
        isLowStock: totalQuantity > 0 && totalQuantity <= r.minimumStock,
        isOutOfStock: totalQuantity === 0,
        nearestExpiryDate: r.nearest_expiry_date
          ? new Date(r.nearest_expiry_date).toISOString()
          : null,
        hasNearExpiryBatch: r.has_near_expiry,
        batchCount: Number(r.batch_count),
      };
    });

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      summary: {
        totalQuantitySum: Number(summaryResult[0]?.qty_sum ?? 0),
        totalStockValue: Number(summaryResult[0]?.value_sum ?? 0),
      },
    };
  }

  // -----------------------
  //   Private Helpers
  // -----------------------

  private async validateSupplier(tx: any, dto: CreateStockVoucherDto) {
    if (
      dto.type === StockVoucherType.PURCHASE ||
      dto.type === StockVoucherType.PURCHASE_RETURN
    ) {
      if (!dto.supplierId) {
        throw new BadRequestException(
          'Supplier is required for purchase transactions',
        );
      }

      const supplier = await tx.businessContact.findFirst({
        where: {
          id: dto.supplierId,
          type: 'SUPPLIER',
          isActive: true,
        },
      });

      if (!supplier) {
        throw new BadRequestException('Invalid or inactive supplier');
      }
    }
  }

  private async createPayments(
    tx: any,
    stockVoucherId: string,
    netTotal: number,
    payments: CreatePaymentDto[],
  ): Promise<void> {
    if (!payments || payments.length === 0) {
      throw new BadRequestException('At least one payment is required');
    }

    const paymentTotal = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    if (Math.abs(paymentTotal - netTotal) > 0.01) {
      throw new BadRequestException(
        `Payment total (${paymentTotal}) must equal voucher total (${netTotal})`,
      );
    }

    for (const payment of payments) {
      if (Number(payment.amount) <= 0) {
        throw new BadRequestException(
          'Payment amount must be greater than zero',
        );
      }

      const paymentAccount = await tx.paymentAccount.findFirst({
        where: {
          id: payment.paymentAccountId,
          isActive: true,
        },
      });

      if (!paymentAccount) {
        throw new BadRequestException(
          `Payment account ${payment.paymentAccountId} not found or inactive`,
        );
      }

      await tx.payment.create({
        data: {
          amount: payment.amount,
          paymentAccountId: payment.paymentAccountId,
          stockVoucherId,
          type: 'PURCHASE',
        },
      });
    }
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

  private mergeDuplicateItems(
    items: StockVoucherItemInput[],
  ): StockVoucherItemInput[] {
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

      existing.packQuantity += item.packQuantity;
      existing.looseQuantity += item.looseQuantity;
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

  private validateVoucherItemAmounts(
    item: StockVoucherItemInput,
    packingSize: number,
  ): void {
    if (item.packQuantity < 0) {
      throw new BadRequestException(
        `Pack quantity must be non-negative for batch ${item.batchNumber}`,
      );
    }
    if (item.looseQuantity < 0) {
      throw new BadRequestException(
        `Loose quantity must be non-negative for batch ${item.batchNumber}`,
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

    const unitQuantity = item.packQuantity * packingSize + item.looseQuantity;

    if (unitQuantity + (item.freeQuantity ?? 0) <= 0) {
      throw new BadRequestException(
        `Quantity must be greater than zero for batch ${item.batchNumber}`,
      );
    }

    const unitRate = packingSize > 0 ? item.purchaseRate / packingSize : 0;
    const expectedGross = this.round2(
      item.packQuantity * item.purchaseRate + item.looseQuantity * unitRate,
    );
    if (Math.abs(expectedGross - item.grossAmount) > 0.01) {
      throw new BadRequestException(
        `Gross amount mismatch for batch ${item.batchNumber}: expected ${expectedGross}, got ${item.grossAmount}`,
      );
    }
  }

  private async getPackingSizeMap(
    tx: any,
    productIds: string[],
  ): Promise<Map<string, number>> {
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, packingSize: true },
    });

    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !found.has(id));
      throw new BadRequestException(
        `Product(s) not found: ${missing.join(', ')}`,
      );
    }

    const map = new Map<string, number>();
    for (const p of products) {
      const size = Number(p.packingSize);
      if (!size || size <= 0) {
        throw new BadRequestException(
          `Invalid packingSize for product ${p.id}`,
        );
      }
      map.set(p.id, size);
    }
    return map;
  }

  private async resolveBatch(
    tx: any,
    item: StockVoucherItemInput,
    voucherType: StockVoucherType,
    expiryDate: Date | null,
    unitQuantity: number,
    packingSize: number,
  ): Promise<any> {
    let batch = await tx.batch.findFirst({
      where: {
        productId: item.productId,
        batchNumber: item.batchNumber,
        expiryDate,
        deletedAt: null,
      },
    });
    const unitPurchaseRate = item.purchaseRate / packingSize;
    const unitSaleRate = item.saleRate / packingSize;

    if (!batch) {
      batch = await tx.batch.create({
        data: {
          productId: item.productId,
          batchNumber: item.batchNumber,
          expiryDate,
          purchaseRate: unitPurchaseRate,
          saleRate: unitSaleRate,
          openingQuantity:
            voucherType === StockVoucherType.OPENING
              ? unitQuantity + (item.freeQuantity ?? 0)
              : 0,
          currentQuantity: unitQuantity + (item.freeQuantity ?? 0),
        },
      });
    } else {
      const rateChanged =
        Number(batch.purchaseRate) !== Number(unitPurchaseRate) ||
        Number(batch.saleRate) !== Number(unitSaleRate);

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
            newPurchaseRate: unitPurchaseRate,
            newSaleRate: unitSaleRate,
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
            increment: unitQuantity + (item.freeQuantity ?? 0),
          },
          ...(rateChanged && {
            purchaseRate: unitPurchaseRate,
            saleRate: unitSaleRate,
          }),
        },
      });

      batch = {
        ...batch,
        currentQuantity:
          batch.currentQuantity + unitQuantity + (item.freeQuantity ?? 0),
        ...(rateChanged && {
          purchaseRate: unitPurchaseRate,
          saleRate: unitSaleRate,
        }),
      };
    }
    return batch;
  }

  private async createStockVoucherItem(
    tx: any,
    voucherId: string,
    batchId: string,
    item: StockVoucherItemInput,
  ): Promise<void> {
    await tx.stockVoucherItem.create({
      data: {
        voucherId,
        productId: item.productId,
        batchId,
        purchaseRate: item.purchaseRate,
        saleRate: item.saleRate,
        packQuantity: item.packQuantity,
        looseQuantity: item.looseQuantity,
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

  private readonly voucherIncludeShape = {
    supplier: { select: { name: true } },
    createdBy: { select: { name: true } },
    payments: { include: { paymentAccount: true } },
    items: { include: { batch: true, product: true } },
  } as const;

  private mapVoucherToDto(voucher: any): StockVoucherOutput {
    return {
      id: voucher.id,
      voucherNumber: voucher.voucherNumber,
      type: voucher.type,
      supplierId: voucher.supplierId,
      supplier: voucher.supplier?.name ?? null,
      date: voucher.date.toISOString(),
      remarks: voucher.remarks,
      grossAmount: Number(voucher.grossAmount),
      discountAmount: Number(voucher.discountAmount),
      taxAmount: Number(voucher.taxAmount),
      netAmount: Number(voucher.netAmount),
      createdBy: voucher.createdBy?.name ?? null,
      createdAt: voucher.createdAt.toISOString(),
      updatedAt: voucher.updatedAt.toISOString(),
      items: voucher.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        batchId: item.batchId,
        batchNumber: item.batch.batchNumber,
        expiryDate: item.batch.expiryDate
          ? item.batch.expiryDate.toISOString()
          : null,
        packQuantity: item.packQuantity,
        looseQuantity: item.looseQuantity,
        freeQuantity: item.freeQuantity,
        purchaseRate: Number(item.purchaseRate),
        saleRate: Number(item.saleRate),
        grossAmount: Number(item.grossAmount),
        discountPercent: item.discountPercent
          ? Number(item.discountPercent)
          : undefined,
        discountAmount: Number(item.discountAmount),
        taxPercent: item.taxPercent ? Number(item.taxPercent) : undefined,
        taxAmount: Number(item.taxAmount),
        netAmount: Number(item.netAmount),
        product: {
          id: item.product.id,
          name: item.product.name,
          code: item.product.code,
        },
        batch: {
          id: item.batch.id,
          batchNumber: item.batch.batchNumber,
          expiryDate: item.batch.expiryDate
            ? item.batch.expiryDate.toISOString()
            : null,
        },
      })),
      payments: (voucher.payments ?? []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentAccountId: p.paymentAccountId,
        paymentAccount: p.paymentAccount
          ? {
              id: p.paymentAccount.id,
              name: p.paymentAccount.name,
              type: p.paymentAccount.type,
            }
          : null,
      })),
    };
  }
}
