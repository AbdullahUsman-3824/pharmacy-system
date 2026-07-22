import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleType } from '@repo/shared';

@Injectable()
export class SaleService {
  constructor(private readonly prisma: PrismaService) {}

  async createSale(dto: CreateSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      const saleNumber = this.generateSaleNumber(dto.type);

      if (dto.type === SaleType.SALE_RETURN && !dto.originalSaleId) {
        throw new BadRequestException(
          'originalSaleId is required for SALE_RETURN',
        );
      }

      let grossTotal = 0;
      let discountTotal = 0;
      let taxTotal = 0;
      let netTotal = 0;

      const sale = await tx.sale.create({
        data: {
          saleNumber,
          type: dto.type,
          customerName: dto.customerName ?? 'Walk-in Customer',
          originalSaleId: dto.originalSaleId ?? null,
          date: new Date(dto.saleDate),
          remarks: dto.remarks,
        },
      });

      for (const item of dto.items) {
        this.validateSaleItemAmounts(item);

        if (dto.type === SaleType.SALE_RETURN) {
          await this.validateReturnQuantity(tx, dto.originalSaleId!, item);
        }

        const batch = await this.resolveBatchForSale(tx, item, dto.type);

        await this.createSaleItem(tx, sale.id, batch.id, item);

        grossTotal += item.grossAmount;
        discountTotal += item.discountAmount ?? 0;
        taxTotal += item.taxAmount ?? 0;
        netTotal += item.netAmount;
      }

      return this.updateSaleTotals(
        tx,
        sale.id,
        grossTotal,
        discountTotal,
        taxTotal,
        netTotal,
      );
    });
  }

  async findAll() {
    const sales = await this.prisma.sale.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        saleNumber: true,
        type: true,
        date: true,
        customerName: true,
        grossAmount: true,
        discountAmount: true,
        taxAmount: true,
        netAmount: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return sales.map((s) => ({
      ...s,
      grossAmount: Number(s.grossAmount),
      discountAmount: Number(s.discountAmount),
      taxAmount: Number(s.taxAmount),
      netAmount: Number(s.netAmount),
    }));
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: {
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

    return {
      ...sale,
      grossAmount: Number(sale.grossAmount),
      discountAmount: Number(sale.discountAmount),
      taxAmount: Number(sale.taxAmount),
      netAmount: Number(sale.netAmount),
      items: sale.items.map((item) => ({
        ...item,
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

  private generateSaleNumber(type: SaleType): string {
    // TODO: Replace with proper numbering service
    return `${type}-${Date.now()}`;
  }

  private validateSaleItemAmounts(item: any): void {
    const expectedGross = item.quantity * item.saleRate;
    if (Math.abs(expectedGross - item.grossAmount) > 0.01) {
      throw new BadRequestException(
        `Gross amount mismatch for batch ${item.batchId}`,
      );
    }
  }

  private async resolveBatchForSale(
    tx: any,
    item: any,
    saleType: SaleType,
  ): Promise<any> {
    const batch = await tx.batch.findFirst({
      where: {
        id: item.batchId,
        deletedAt: null,
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${item.batchId} not found`);
    }

    if (saleType === SaleType.SALE && batch.currentQuantity < item.quantity) {
      throw new BadRequestException({
        message: `Insufficient stock in batch ${batch.batchNumber}. Available: ${batch.currentQuantity}, requested: ${item.quantity}.`,
        code: 'INSUFFICIENT_STOCK',
        batchId: batch.id,
        available: batch.currentQuantity,
        requested: item.quantity,
      });
    }

    const quantityDelta =
      saleType === SaleType.SALE ? -item.quantity : item.quantity;

    await tx.batch.update({
      where: { id: batch.id },
      data: {
        currentQuantity: {
          increment: quantityDelta,
        },
      },
    });

    return batch;
  }

  private async validateReturnQuantity(
    tx: any,
    originalSaleId: string,
    item: any,
  ): Promise<void> {
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
        sale: {
          type: SaleType.SALE_RETURN,
          originalSaleId,
        },
      },
    });

    const alreadyReturned = previousReturns.reduce(
      (sum: number, r: any) => sum + r.quantity,
      0,
    );

    const availableToReturn = originalItem.quantity - alreadyReturned;

    if (item.quantity > availableToReturn) {
      throw new BadRequestException({
        message: `Return quantity exceeds what's available to return for this item. Originally sold: ${originalItem.quantity}, already returned: ${alreadyReturned}, available: ${availableToReturn}.`,
        code: 'RETURN_QUANTITY_EXCEEDS_ORIGINAL',
        productId: item.productId,
        batchId: item.batchId,
        originalQuantity: originalItem.quantity,
        alreadyReturned,
        availableToReturn,
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
        saleRate: item.saleRate,
        quantity: item.quantity,
        grossAmount: item.grossAmount,
        discountPercent: item.discountPercent ?? null,
        discountAmount: item.discountAmount ?? 0,
        taxPercent: item.taxPercent ?? null,
        taxAmount: item.taxAmount ?? 0,
        netAmount: item.netAmount,
      },
    });
  }

  private async updateSaleTotals(
    tx: any,
    saleId: string,
    grossTotal: number,
    discountTotal: number,
    taxTotal: number,
    netTotal: number,
  ): Promise<any> {
    return tx.sale.update({
      where: { id: saleId },
      data: {
        grossAmount: grossTotal,
        discountAmount: discountTotal,
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
}
