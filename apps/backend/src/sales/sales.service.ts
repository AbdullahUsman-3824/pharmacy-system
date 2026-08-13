import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreatePaymentDto, SaleType } from '@repo/shared';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================== CREATE SALE =====================
  async createSale(dto: CreateSaleDto) {
    const sale = await this.prisma.$transaction(async (tx) => {
      if (dto.type === SaleType.SALE_RETURN && !dto.originalSaleId) {
        throw new BadRequestException(
          'originalSaleId is required for SALE_RETURN',
        );
      }

      const saleNumber = await this.generateSaleNumber(tx, dto.type);

      const mergedItems = this.mergeDuplicateItems(dto.items);

      await this.validateCustomer(tx, dto);

      const createdSale = await tx.sale.create({
        data: {
          saleNumber,
          type: dto.type,
          customerId: dto.customerId,
          originalSaleId: dto.originalSaleId ?? null,
          date: new Date(dto.saleDate),
          remarks: dto.remarks,
        },
      });

      let grossTotal = 0;

      for (const item of mergedItems) {
        this.validateSaleItemAmounts(item);

        if (dto.type === SaleType.SALE_RETURN) {
          await this.validateReturnQuantity(tx, dto.originalSaleId!, item);
        }

        const batch = await this.resolveBatchForSale(tx, item, dto.type);

        await this.createSaleItem(tx, createdSale.id, batch.id, item);

        grossTotal += item.grossAmount;
      }

      const discountPercent = dto.discountPercent ?? 0;
      const taxPercent = dto.taxPercent ?? 0;

      const discountTotal = this.round2(grossTotal * (discountPercent / 100));
      const taxableAmount = this.round2(grossTotal - discountTotal);
      const taxTotal = this.round2(taxableAmount * (taxPercent / 100));
      const netTotal = this.round2(taxableAmount + taxTotal);

      await this.updateSaleTotals(
        tx,
        createdSale.id,
        grossTotal,
        discountPercent,
        discountTotal,
        taxPercent,
        taxTotal,
        netTotal,
      );

      await this.createPayments(tx, createdSale.id, netTotal, dto.payments);

      return tx.sale.findUnique({
        where: {
          id: createdSale.id,
        },
        include: {
          customer: true,
          payments: {
            include: {
              paymentAccount: true,
            },
          },
          items: {
            include: {
              batch: true,
              product: true,
            },
          },
        },
      });
    });

    return this.serializeSale(sale);
  }

  // ===================== FIND ALL (with cursor support) =====================
  async findAll(params?: { skip?: number; take?: number; cursor?: string }) {
    const take = params?.take ?? 20;
    const skip = params?.skip ?? 0;
    const cursor = params?.cursor;

    const where = { deletedAt: null };

    // Use cursor-based pagination if cursor provided, else offset
    const [sales, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        select: {
          id: true,
          saleNumber: true,
          type: true,
          date: true,
          customerId: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          grossAmount: true,
          discountPercent: true,
          discountAmount: true,
          taxPercent: true,
          taxAmount: true,
          netAmount: true,
        },
        orderBy: { date: 'desc' },
        skip: cursor ? undefined : skip,
        take,
        cursor: cursor ? { id: cursor } : undefined,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales.map((s) => ({
        ...s,
        customerName: s.customer.name,
        grossAmount: Number(s.grossAmount),
        discountPercent:
          s.discountPercent !== null ? Number(s.discountPercent) : null,
        discountAmount: Number(s.discountAmount),
        taxPercent: s.taxPercent !== null ? Number(s.taxPercent) : null,
        taxAmount: Number(s.taxAmount),
        netAmount: Number(s.netAmount),
      })),
      total,
      skip,
      take,
      // Return nextCursor for the frontend to use
      nextCursor: sales.length === take ? sales[sales.length - 1].id : null,
    };
  }

  // ===================== FIND ONE =====================
  async findOne(id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,

        payments: {
          include: {
            paymentAccount: true,
          },
        },

        items: {
          include: {
            batch: true,
            product: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }

    return this.serializeSale(sale);
  }

  // ===================== FIND BY SALE NUMBER =====================
  async findBySaleNumber(saleNumber: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        saleNumber: { equals: saleNumber, mode: 'insensitive' },
        deletedAt: null,
      },
      include: {
        customer: true,
        payments: {
          include: {
            paymentAccount: true,
          },
        },
        items: {
          include: {
            batch: true,
            product: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${saleNumber} not found`);
    }

    return this.serializeSale(sale);
  }

  // ===================== SEARCH (enhanced) =====================
  async searchSales(query: string, limit = 10) {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 2) {
      return []; // require at least 2 chars to avoid heavy scans
    }

    const sales = await this.prisma.sale.findMany({
      where: {
        deletedAt: null,
        type: SaleType.SALE,
        OR: [
          { saleNumber: { contains: trimmed, mode: 'insensitive' } },
          {
            customer: {
              name: {
                contains: trimmed,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        saleNumber: true,
        customerId: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        date: true,
        netAmount: true,
      },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return sales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      customerId: s.customerId,
      customerName: s.customer.name,
      date: s.date,
      netAmount: Number(s.netAmount),
    }));
  }

  // ===================== GET RETURNABLE ITEMS (optimized) =====================
  async getReturnableItems(originalSaleId: string) {
    const originalSale = await this.prisma.sale.findFirst({
      where: { id: originalSaleId, deletedAt: null },
      include: {
        items: {
          include: { product: true, batch: true },
        },
      },
    });

    if (!originalSale) {
      throw new NotFoundException(`Sale ${originalSaleId} not found`);
    }

    if ((originalSale.type as string) !== (SaleType.SALE as string)) {
      throw new BadRequestException(
        `Sale ${originalSaleId} is not an original sale and cannot be returned against`,
      );
    }

    // Aggregate previous returns efficiently using groupBy
    const previousReturns = await this.prisma.saleItem.groupBy({
      by: ['productId', 'batchId'],
      where: {
        sale: {
          type: SaleType.SALE_RETURN,
          originalSaleId,
          deletedAt: null,
        },
      },
      _sum: {
        packQuantity: true,
        looseQuantity: true,
      },
    });

    const returnedMap = new Map<string, { pack: number; loose: number }>();
    for (const ret of previousReturns) {
      const key = `${ret.productId}|${ret.batchId}`;
      returnedMap.set(key, {
        pack: ret._sum.packQuantity || 0,
        loose: ret._sum.looseQuantity || 0,
      });
    }

    return {
      saleId: originalSale.id,
      saleNumber: originalSale.saleNumber,
      items: originalSale.items.map((item) => {
        const key = `${item.productId}|${item.batchId}`;
        const returned = returnedMap.get(key) || { pack: 0, loose: 0 };

        return {
          productId: item.productId,
          productName: item.product?.name,
          batchId: item.batchId,
          batchNumber: item.batch?.batchNumber,
          saleRate: Number(item.saleRate),
          looseRate: item.looseRate !== null ? Number(item.looseRate) : null,
          originalPackQuantity: item.packQuantity,
          originalLooseQuantity: item.looseQuantity,
          alreadyReturnedPacks: returned.pack,
          alreadyReturnedLoose: returned.loose,
          availablePacksToReturn: item.packQuantity - returned.pack,
          availableLooseToReturn: item.looseQuantity - returned.loose,
        };
      }),
    };
  }

  // ===================== SOFT DELETE =====================
  async softDelete(id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, deletedAt: null },
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }

    return this.prisma.sale.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ===================== PRIVATE HELPERS =====================

  private async generateSaleNumber(tx: any, type: SaleType): Promise<string> {
    const dateKey = this.formatDateKey(new Date());
    const prefix = type === SaleType.SALE ? 'SL' : 'RT';

    const counter = await tx.saleNumberCounter.upsert({
      where: { type_dateKey: { type, dateKey } },
      create: { type, dateKey, seq: 1 },
      update: { seq: { increment: 1 } },
    });

    const seq = String(counter.seq).padStart(4, '0');
    return `${prefix}-${dateKey}-${seq}`;
  }

  private formatDateKey(date: Date): string {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }

  private serializeSale(sale: any) {
    return {
      ...sale,

      grossAmount: Number(sale.grossAmount),

      discountPercent:
        sale.discountPercent !== null ? Number(sale.discountPercent) : null,

      discountAmount: Number(sale.discountAmount),

      taxPercent: sale.taxPercent !== null ? Number(sale.taxPercent) : null,

      taxAmount: Number(sale.taxAmount),

      netAmount: Number(sale.netAmount),

      payments:
        sale.payments?.map((payment: any) => ({
          ...payment,
          amount: Number(payment.amount),
          paymentAccount: payment.paymentAccount,
        })) ?? [],

      items: sale.items.map((item: any) => ({
        ...item,
        productName: item.product?.name,
        saleRate: Number(item.saleRate),
        looseRate: item.looseRate !== null ? Number(item.looseRate) : null,
        grossAmount: Number(item.grossAmount),
        netAmount: Number(item.netAmount),

        batch: {
          ...item.batch,
          purchaseRate: Number(item.batch.purchaseRate),
          saleRate: Number(item.batch.saleRate),
        },
      })),
    };
  }

  private mergeDuplicateItems(items: any[]): any[] {
    const grouped = new Map<string, any>();

    for (const item of items) {
      const key = `${item.productId}|${item.batchId}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, { ...item });
        continue;
      }

      const existingSaleRate = Number(existing.saleRate);
      const itemSaleRate = Number(item.saleRate);
      const existingLooseRate =
        existing.looseRate === null ? null : Number(existing.looseRate);
      const itemLooseRate =
        item.looseRate === null ? null : Number(item.looseRate);

      if (
        existingSaleRate !== itemSaleRate ||
        existingLooseRate !== itemLooseRate
      ) {
        throw new BadRequestException(
          `Conflicting rate for the same product/batch in one invoice (batch ${item.batchId})`,
        );
      }

      existing.packQuantity += item.packQuantity;
      existing.looseQuantity += item.looseQuantity;
      existing.grossAmount += item.grossAmount;
      existing.netAmount += item.netAmount;
    }

    return Array.from(grouped.values());
  }

  private validateSaleItemAmounts(item: any): void {
    if (item.packQuantity < 0 || item.looseQuantity < 0) {
      throw new BadRequestException(
        `Quantities must be non-negative for batch ${item.batchId}`,
      );
    }

    if (item.packQuantity <= 0 && item.looseQuantity <= 0) {
      throw new BadRequestException(
        `Line for batch ${item.batchId} must have a pack or loose quantity greater than 0`,
      );
    }

    const expectedGross = this.round2(
      item.packQuantity * item.saleRate +
        item.looseQuantity * (item.looseRate || 0),
    );

    if (Math.abs(expectedGross - item.grossAmount) > 0.01) {
      throw new BadRequestException(
        `Gross amount mismatch for batch ${item.batchId}: expected ${expectedGross}, got ${item.grossAmount}`,
      );
    }
    if (Math.abs(item.grossAmount - item.netAmount) > 0.01) {
      throw new BadRequestException(
        `Net amount must equal gross amount at the line level for batch ${item.batchId}`,
      );
    }
  }

  private async resolveBatchForSale(
    tx: any,
    item: any,
    saleType: SaleType,
  ): Promise<any> {
    const batch = await tx.batch.findFirst({
      where: { id: item.batchId, deletedAt: null },
      include: { product: true },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${item.batchId} not found`);
    }

    const packingSize = Number(batch.product.packingSize) || 1;

    if (saleType === SaleType.SALE) {
      const { currentQuantityDelta, looseQuantityDelta } =
        this.computeStockDeltaForSale(batch, item, packingSize);

      await tx.batch.update({
        where: { id: batch.id },
        data: {
          currentQuantity: { increment: currentQuantityDelta },
          looseQuantity: { increment: looseQuantityDelta },
        },
      });
    } else {
      // Return: add stock back
      await tx.batch.update({
        where: { id: batch.id },
        data: {
          currentQuantity: { increment: item.packQuantity },
          looseQuantity: { increment: item.looseQuantity },
        },
      });
    }

    return batch;
  }

  private computeStockDeltaForSale(
    batch: any,
    item: any,
    packingSize: number,
  ): { currentQuantityDelta: number; looseQuantityDelta: number } {
    if (packingSize <= 0) {
      throw new BadRequestException(
        `Invalid packingSize (${packingSize}) for product in batch ${batch.batchNumber}`,
      );
    }

    if (batch.currentQuantity < item.packQuantity) {
      throw new BadRequestException({
        message: `Insufficient stock in batch ${batch.batchNumber}. Available: ${batch.currentQuantity} packs, requested: ${item.packQuantity}.`,
        code: 'INSUFFICIENT_STOCK',
        batchId: batch.id,
        available: batch.currentQuantity,
        requested: item.packQuantity,
      });
    }

    const remainingPacksAfterPackSale =
      batch.currentQuantity - item.packQuantity;

    const availableForLoose =
      batch.looseQuantity + remainingPacksAfterPackSale * packingSize;

    if (availableForLoose < item.looseQuantity) {
      throw new BadRequestException({
        message: `Insufficient stock in batch ${batch.batchNumber}. Available: ${availableForLoose} loose units, requested: ${item.looseQuantity}.`,
        code: 'INSUFFICIENT_STOCK',
        batchId: batch.id,
        available: availableForLoose,
        requested: item.looseQuantity,
      });
    }

    let currentQuantityDelta = -item.packQuantity;
    let looseQuantityDelta = 0;

    if (item.looseQuantity <= batch.looseQuantity) {
      looseQuantityDelta = -item.looseQuantity;
    } else {
      const shortfall = item.looseQuantity - batch.looseQuantity;
      const packsToBreak = Math.ceil(shortfall / packingSize);
      currentQuantityDelta -= packsToBreak;

      const looseAfterBreaking =
        batch.looseQuantity + packsToBreak * packingSize - item.looseQuantity;
      looseQuantityDelta = looseAfterBreaking - batch.looseQuantity;
    }

    return { currentQuantityDelta, looseQuantityDelta };
  }

  private async validateReturnQuantity(
    tx: any,
    originalSaleId: string,
    item: any,
  ): Promise<void> {
    if (item.packQuantity < 0 || item.looseQuantity < 0) {
      throw new BadRequestException(
        `Return quantities must be non-negative for batch ${item.batchId}`,
      );
    }

    const originalItem = await tx.saleItem.findFirst({
      where: {
        saleId: originalSaleId,
        productId: item.productId,
        batchId: item.batchId,
      },
    });

    if (!originalItem) {
      throw new BadRequestException({
        message: `No matching item found in original sale for this product/batch.`,
        code: 'ORIGINAL_SALE_ITEM_NOT_FOUND',
        productId: item.productId,
        batchId: item.batchId,
      });
    }

    const previousReturns = await tx.saleItem.findMany({
      where: {
        productId: item.productId,
        batchId: item.batchId,
        sale: { type: SaleType.SALE_RETURN, originalSaleId },
      },
    });

    const alreadyReturnedPacks = previousReturns.reduce(
      (sum: number, r: any) => sum + r.packQuantity,
      0,
    );
    const alreadyReturnedLoose = previousReturns.reduce(
      (sum: number, r: any) => sum + r.looseQuantity,
      0,
    );

    const availablePacksToReturn =
      originalItem.packQuantity - alreadyReturnedPacks;
    const availableLooseToReturn =
      originalItem.looseQuantity - alreadyReturnedLoose;

    if (
      item.packQuantity > availablePacksToReturn ||
      item.looseQuantity > availableLooseToReturn
    ) {
      throw new BadRequestException({
        message: `Return quantity exceeds what's available to return for this item.`,
        code: 'RETURN_QUANTITY_EXCEEDS_ORIGINAL',
        productId: item.productId,
        batchId: item.batchId,
        originalPackQuantity: originalItem.packQuantity,
        originalLooseQuantity: originalItem.looseQuantity,
        alreadyReturnedPacks,
        alreadyReturnedLoose,
        availablePacksToReturn,
        availableLooseToReturn,
      });
    }
  }

  private async createSaleItem(
    tx: any,
    saleId: string,
    batchId: string,
    item: any,
  ): Promise<void> {
    await tx.saleItem.create({
      data: {
        saleId,
        productId: item.productId,
        batchId,
        packQuantity: item.packQuantity,
        saleRate: item.saleRate,
        looseQuantity: item.looseQuantity,
        looseRate: item.looseQuantity > 0 ? item.looseRate : null,
        grossAmount: item.grossAmount,
        netAmount: item.netAmount,
      },
    });
  }

  private async updateSaleTotals(
    tx: any,
    saleId: string,
    grossTotal: number,
    discountPercent: number,
    discountTotal: number,
    taxPercent: number,
    taxTotal: number,
    netTotal: number,
  ): Promise<any> {
    return tx.sale.update({
      where: { id: saleId },
      data: {
        grossAmount: grossTotal,
        discountPercent,
        discountAmount: discountTotal,
        taxPercent,
        taxAmount: taxTotal,
        netAmount: netTotal,
      },
      include: {
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

  private async createPayments(
    tx: any,
    saleId: string,
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
        `Payment total (${paymentTotal}) must equal sale total (${netTotal})`,
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
          saleId,
          type: 'SALE',
        },
      });
    }
  }

  private async validateCustomer(tx: any, dto: CreateSaleDto): Promise<void> {
    const customer = await tx.businessContact.findFirst({
      where: {
        id: dto.customerId,
        type: 'CUSTOMER',
        isActive: true,
      },
    });

    if (!customer) {
      throw new BadRequestException('Invalid or inactive customer');
    }
  }
}
