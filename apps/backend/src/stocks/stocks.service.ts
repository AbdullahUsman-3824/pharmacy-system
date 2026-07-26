import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async findAll() {
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
      },
      orderBy: {
        date: 'desc',
      },
    });

    // convert Decimal -> number here, once, so every consumer gets real numbers
    return vouchers.map((v) => ({
      ...v,
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
      const rateChanged =
        Number(batch.purchaseRate) !== item.purchaseRate ||
        Number(batch.saleRate) !== item.saleRate;

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
}
