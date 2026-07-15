import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockVoucherDto } from './dto/create-stock-voucher.dto';
import { StockVoucherType } from '@repo/shared';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async createVoucher(dto: CreateStockVoucherDto) {
    return this.prisma.$transaction(async (tx) => {
      const voucherNumber = this.generateVoucherNumber(dto.type);

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

      for (const item of dto.items) {
        const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;

        this.validateVoucherItemAmounts(item);

        const batch = await this.resolveBatch(
          tx,
          item,
          dto.type,
          dto.supplierId,
          expiryDate,
        );

        await this.updateProductRates(tx, item);

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

  findAll() {
    return this.prisma.stockVoucher.findMany({
      where: {
        deletedAt: null,
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
      orderBy: {
        date: 'desc',
      },
    });
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
      orderBy: {
        expiryDate: 'asc', // FEFO
      },
    });

    return {
      productId,
      totalQuantity: batches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0,
      ),
      batches,
    };
  }

  private generateVoucherNumber(type: StockVoucherType): string {
    // TODO: Replace with proper numbering service
    return `${type}-${Date.now()}`;
  }

  private validateVoucherItemAmounts(item: any): void {
    const expectedGross = item.quantity * item.purchaseRate;
    if (Math.abs(expectedGross - item.grossAmount) > 0.01) {
      throw new BadRequestException(
        `Gross amount mismatch for batch ${item.batchNumber}`,
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
      await tx.batch.update({
        where: {
          id: batch.id,
        },
        data: {
          currentQuantity: {
            increment: item.quantity + (item.freeQuantity ?? 0),
          },
        },
      });
      batch = {
        ...batch,
        currentQuantity:
          batch.currentQuantity + item.quantity + (item.freeQuantity ?? 0),
      };
    }
    return batch;
  }

  private async updateProductRates(tx: any, item: any): Promise<void> {
    await tx.product.update({
      where: {
        id: item.productId,
      },
      data: {
        purchaseRate: item.purchaseRate,
        saleRate: item.saleRate,
      },
    });
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
}
