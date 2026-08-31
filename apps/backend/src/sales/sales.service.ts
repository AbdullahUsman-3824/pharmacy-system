import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import {
  CreatePaymentDto,
  CreateSaleItemInput,
  SaleType,
  SaleSortField,
  SalesListQuery,
  SaleListResponse,
  SaleProductOption,
  SaleDetailDto,
  SerializedSale,
  SaleDto,
  ReturnableSaleDto,
} from '@repo/shared';
import { buildPagination, withOrder } from '../common/pagination.helper';
import { Prisma } from '../generated/prisma/client';
import { UsersService } from '../user/user.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  // ===================== CREATE SALE =====================
  async createSale(dto: CreateSaleDto): Promise<SerializedSale> {
    const createdBy = await this.usersService.findByPin(dto.creatorPin);

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
          customerId: dto.customerId ?? null,
          originalSaleId: dto.originalSaleId ?? null,
          date: new Date(dto.saleDate),
          remarks: dto.remarks,
          createdById: createdBy.id,
        },
      });

      const packingSizeMap = await this.getPackingSizeMap(tx, [
        ...new Set(mergedItems.map((i) => i.productId)),
      ]);

      let grossTotal = 0;

      for (const item of mergedItems) {
        const packingSize = packingSizeMap.get(item.productId)!;
        const unitQuantity =
          item.packQuantity * packingSize + item.looseQuantity;

        this.validateSaleItemAmounts(item, unitQuantity);

        if (dto.type === SaleType.SALE_RETURN) {
          await this.validateReturnQuantity(tx, dto.originalSaleId!, item);
        }

        await this.resolveBatchForSale(tx, item, dto.type, unitQuantity);
        await this.createSaleItem(tx, createdSale.id, item.batchId, item);

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
        where: { id: createdSale.id },
        include: this.saleIncludeShape,
      });
    });

    return this.serializeSale(sale);
  }

  // ===================== FIND ALL ========================

  saleSortFieldMap: Record<SaleSortField, object> = {
    [SaleSortField.DATE]: { date: undefined },
    [SaleSortField.SALE_NUMBER]: { saleNumber: undefined },
    [SaleSortField.NET_AMOUNT]: { netAmount: undefined },
    [SaleSortField.CUSTOMER_NAME]: { customer: { name: undefined } },
  };

  async findAll(query: SalesListQuery): Promise<SaleListResponse> {
    const { skip, take, page, pageSize } = buildPagination(query);
    const search = query.search?.trim();
    const isSearching = !!search && search.length >= 2;

    const where: Prisma.SaleWhereInput = {
      deletedAt: null,
      ...(isSearching && {
        OR: [
          { saleNumber: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(query.types?.length && { type: { in: query.types } }),
    };

    const orderShape =
      this.saleSortFieldMap[query.sortBy ?? SaleSortField.DATE];
    const orderBy = withOrder(orderShape, query.sortOrder ?? 'desc');

    const [sales, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        select: {
          id: true,
          saleNumber: true,
          type: true,
          date: true,
          customerId: true,
          customer: { select: { name: true } },
          originalSaleId: true,
          remarks: true,
          grossAmount: true,
          discountPercent: true,
          discountAmount: true,
          taxPercent: true,
          taxAmount: true,
          netAmount: true,
          createdById: true,
          createdBy: { select: { name: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
        skip,
        take,
      }),
      this.prisma.sale.count({ where }),
    ]);

    const data: SaleDto[] = sales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      type: s.type as unknown as SaleType,
      date: s.date.toISOString(),
      customerId: s.customerId,
      customerName: s.customer?.name ?? null,
      originalSaleId: s.originalSaleId,
      remarks: s.remarks,
      grossAmount: Number(s.grossAmount),
      discountPercent:
        s.discountPercent !== null ? Number(s.discountPercent) : null,
      discountAmount: Number(s.discountAmount),
      taxPercent: s.taxPercent !== null ? Number(s.taxPercent) : null,
      taxAmount: Number(s.taxAmount),
      netAmount: Number(s.netAmount),
      createdById: s.createdById ?? null,
      createdByName: s.createdBy?.name ?? null,
      createdAt: s.createdAt?.toISOString(),
      updatedAt: s.updatedAt?.toISOString(),
    }));

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ===================== FIND ONE =====================
  async findOne(id: string): Promise<SaleDetailDto> {
    const sale = await this.prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: this.saleIncludeShape,
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }

    return this.serializeSaleDetail(sale);
  }

  // ===================== FIND BY SALE NUMBER =====================
  async findBySaleNumber(saleNumber: string): Promise<SaleDetailDto> {
    const sale = await this.prisma.sale.findFirst({
      where: {
        saleNumber: { equals: saleNumber, mode: 'insensitive' },
        deletedAt: null,
      },
      include: this.saleIncludeShape,
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${saleNumber} not found`);
    }

    return this.serializeSaleDetail(sale);
  }

  // ===================== GET RETURNABLE ITEMS =====================
  async getReturnableItems(originalSaleId: string): Promise<ReturnableSaleDto> {
    const originalSale = await this.prisma.sale.findFirst({
      where: { id: originalSaleId, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                packingSize: true,
              },
            },
            batch: {
              select: {
                id: true,
                batchNumber: true,
              },
            },
          },
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
      customerId: originalSale.customerId,
      customerName: originalSale.customer?.name ?? null,
      items: originalSale.items.map((item) => {
        const key = `${item.productId}|${item.batchId}`;
        const returned = returnedMap.get(key) || { pack: 0, loose: 0 };

        const packingSize = Number(item.product?.packingSize) || 1;
        const availablePacks = item.packQuantity - returned.pack;
        const availableLoose = item.looseQuantity - returned.loose;

        return {
          productId: item.productId,
          productName: item.product?.name,
          batchId: item.batchId,
          batchNumber: item.batch?.batchNumber,
          saleRate: Number(item.saleRate),
          packingSize,

          originalPackQuantity: item.packQuantity,
          originalLooseQuantity: item.looseQuantity,
          alreadyReturnedPacks: returned.pack,
          alreadyReturnedLoose: returned.loose,

          availablePacksToReturn: availablePacks,
          availableLooseToReturn: availableLoose,
          availableUnitsToReturn: availablePacks * packingSize + availableLoose,
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

  // ===================== GET SALE-PRODUCT OPTIONS =====================
  async getSaleProductOptions(search: string): Promise<SaleProductOption[]> {
    const trimmedSearch = search.trim();

    if (trimmedSearch.length < 2) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { name: { contains: trimmedSearch, mode: 'insensitive' } },
          { code: { contains: trimmedSearch, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: {
        id: true,
        name: true,
        batches: {
          where: { deletedAt: null },
          select: { currentQuantity: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => {
      const totalUnits = p.batches.reduce(
        (sum, b) => sum + b.currentQuantity,
        0,
      );

      return {
        id: p.id,
        name: p.name,
        currentQuantity: p.batches.length > 0 ? totalUnits : null,
      };
    });
  }

  // ===================== PRIVATE HELPERS =====================

  private readonly saleIncludeShape = {
    customer: { select: { name: true } },
    createdBy: { select: { name: true } },
    payments: { include: { paymentAccount: true } },
    items: { include: { batch: true, product: true } },
  } as const;

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

  private serializeSale(sale: any): SerializedSale {
    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      date: sale.date.toISOString(),
      customerName: sale.customer?.name ?? null,
      createdByName: sale.createdBy?.name ?? '',
      grossAmount: Number(sale.grossAmount),
      discountPercent:
        sale.discountPercent !== null ? Number(sale.discountPercent) : null,
      discountAmount: Number(sale.discountAmount),
      taxPercent: sale.taxPercent !== null ? Number(sale.taxPercent) : null,
      taxAmount: Number(sale.taxAmount),
      netAmount: Number(sale.netAmount),
      items: (sale.items ?? []).map((item: any) => ({
        productName: item.product?.name ?? 'Unknown',
        packQuantity: item.packQuantity,
        looseQuantity: item.looseQuantity,
        saleRate: Number(item.saleRate),
        grossAmount: Number(item.grossAmount),
        netAmount: Number(item.netAmount),
      })),
    };
  }

  private serializeSaleDetail(sale: any): SaleDetailDto {
    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      type: sale.type as SaleType,
      date: sale.date.toISOString(),

      customerId: sale.customerId,
      customerName: sale.customer?.name ?? null,

      originalSaleId: sale.originalSaleId,
      remarks: sale.remarks,

      grossAmount: Number(sale.grossAmount),
      discountPercent:
        sale.discountPercent !== null ? Number(sale.discountPercent) : null,
      discountAmount: Number(sale.discountAmount),
      taxPercent: sale.taxPercent !== null ? Number(sale.taxPercent) : null,
      taxAmount: Number(sale.taxAmount),
      netAmount: Number(sale.netAmount),

      createdById: sale.createdById ?? null,
      createdByName: sale.createdBy?.name ?? null,
      createdAt: sale.createdAt?.toISOString(),
      updatedAt: sale.updatedAt?.toISOString(),
      deletedAt: sale.deletedAt?.toISOString() ?? null,

      items: (sale.items ?? []).map((item: any) => ({
        id: item.id,
        saleId: item.saleId,
        productId: item.productId,
        batchId: item.batchId,
        packQuantity: item.packQuantity,
        looseQuantity: item.looseQuantity,
        saleRate: Number(item.saleRate),
        grossAmount: Number(item.grossAmount),
        netAmount: Number(item.netAmount),
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString(),

        product: {
          id: item.product.id,
          name: item.product.name,
          code: item.product.code,
        },

        batch: {
          id: item.batch.id,
          batchNumber: item.batch.batchNumber,
          expiryDate: item.batch.expiryDate?.toISOString() ?? null,
          purchaseRate: Number(item.batch.purchaseRate),
          saleRate: Number(item.batch.saleRate),
          openingQuantity: item.batch.openingQuantity,
          currentQuantity: item.batch.currentQuantity,
          manufacturingDate:
            item.batch.manufacturingDate?.toISOString() ?? null,
          isActive: item.batch.isActive,
        },
      })),

      // payments belong at the sale level, NOT inside each item
      payments: (sale.payments ?? []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentAccountId: p.paymentAccountId,
        type: p.type,
        paymentAccount: p.paymentAccount
          ? {
              id: p.paymentAccount.id,
              name: p.paymentAccount.name,
            }
          : null,
      })),
    };
  }

  private mergeDuplicateItems(
    items: CreateSaleItemInput[],
  ): CreateSaleItemInput[] {
    const grouped = new Map<string, CreateSaleItemInput>();

    for (const item of items) {
      const key = `${item.productId}|${item.batchId}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, { ...item });
        continue;
      }

      if (Number(existing.saleRate) !== Number(item.saleRate)) {
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

  private validateSaleItemAmounts(
    item: CreateSaleItemInput,
    unitQuantity: number,
  ): void {
    if (item.packQuantity < 0 || item.looseQuantity < 0) {
      throw new BadRequestException(
        `Quantities must be non-negative for batch ${item.batchId}`,
      );
    }

    if (unitQuantity <= 0) {
      throw new BadRequestException(
        `Line for batch ${item.batchId} must have quantity greater than 0`,
      );
    }

    if (item.saleRate < 0) {
      throw new BadRequestException(
        `Sale rate must be non-negative for batch ${item.batchId}`,
      );
    }

    const expectedGross = this.round2(unitQuantity * item.saleRate);
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

  private async getPackingSizeMap(
    tx: any,
    productIds: string[],
  ): Promise<Map<string, number>> {
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, packingSize: true },
    });

    if (products.length !== productIds.length) {
      const found = new Set(products.map((p: any) => p.id));
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

  private async resolveBatchForSale(
    tx: any,
    item: CreateSaleItemInput,
    saleType: SaleType,
    unitQuantity: number,
  ): Promise<void> {
    const batch = await tx.batch.findFirst({
      where: { id: item.batchId, deletedAt: null },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${item.batchId} not found`);
    }

    if (batch.productId !== item.productId) {
      throw new BadRequestException(
        `Batch ${item.batchId} does not belong to product ${item.productId}`,
      );
    }

    if (saleType === SaleType.SALE) {
      if (batch.currentQuantity < unitQuantity) {
        throw new BadRequestException({
          message: `Insufficient stock in batch ${batch.batchNumber}. Available: ${batch.currentQuantity} units, requested: ${unitQuantity}.`,
          code: 'INSUFFICIENT_STOCK',
          batchId: batch.id,
          available: batch.currentQuantity,
          requested: unitQuantity,
        });
      }

      await tx.batch.update({
        where: { id: batch.id },
        data: { currentQuantity: { decrement: unitQuantity } },
      });
    } else {
      // SALE_RETURN → add units back
      await tx.batch.update({
        where: { id: batch.id },
        data: { currentQuantity: { increment: unitQuantity } },
      });
    }
  }

  private async validateReturnQuantity(
    tx: any,
    originalSaleId: string,
    item: CreateSaleItemInput,
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
      include: {
        product: { select: { packingSize: true } },
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

    const packingSize = Number(originalItem.product?.packingSize) || 1;

    // Original units
    const originalUnits =
      originalItem.packQuantity * packingSize + originalItem.looseQuantity;

    // Already returned units
    const previousReturns = await tx.saleItem.findMany({
      where: {
        productId: item.productId,
        batchId: item.batchId,
        sale: {
          type: SaleType.SALE_RETURN,
          originalSaleId,
          deletedAt: null,
        },
      },
    });

    const alreadyReturnedUnits = previousReturns.reduce(
      (sum: number, r: any) =>
        sum + r.packQuantity * packingSize + r.looseQuantity,
      0,
    );

    const availableUnits = originalUnits - alreadyReturnedUnits;

    // Requested return units
    const requestedUnits = item.packQuantity * packingSize + item.looseQuantity;

    if (requestedUnits <= 0) {
      throw new BadRequestException(
        `Return quantity must be greater than zero for batch ${item.batchId}`,
      );
    }

    if (requestedUnits > availableUnits) {
      throw new BadRequestException({
        message: `Return quantity exceeds what's available to return for this item.`,
        code: 'RETURN_QUANTITY_EXCEEDS_ORIGINAL',
        productId: item.productId,
        batchId: item.batchId,
        originalUnits,
        alreadyReturnedUnits,
        availableUnits,
        requestedUnits,
      });
    }
  }

  private async createSaleItem(
    tx: any,
    saleId: string,
    batchId: string,
    item: CreateSaleItemInput,
  ): Promise<void> {
    await tx.saleItem.create({
      data: {
        saleId,
        productId: item.productId,
        batchId,
        packQuantity: item.packQuantity,
        looseQuantity: item.looseQuantity,
        saleRate: item.saleRate,
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
  ): Promise<void> {
    await tx.sale.update({
      where: { id: saleId },
      data: {
        grossAmount: grossTotal,
        discountPercent,
        discountAmount: discountTotal,
        taxPercent,
        taxAmount: taxTotal,
        netAmount: netTotal,
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
    // Walk-in allowed when customerId is omitted / null
    if (!dto.customerId) return;

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
