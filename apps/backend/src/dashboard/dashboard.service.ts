import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardStatsDto,
  RecentPurchaseDto,
  RecentSaleDto,
  SaleType,
} from '@repo/shared';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStatsDto> {
    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const expiryThreshold = new Date(now);
    expiryThreshold.setDate(expiryThreshold.getDate() + 30);

    const [
      todaySalesAgg,
      todaySalesCount,
      stockByProduct,
      nearExpiryCount,
      allProducts,
      recentSalesRaw,
      recentPurchasesRaw,
    ] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          deletedAt: null,
          type: SaleType.SALE,
        },
        _sum: { netAmount: true },
      }),
      this.prisma.sale.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          deletedAt: null,
          type: SaleType.SALE,
        },
      }),
      this.prisma.batch.groupBy({
        by: ['productId'],
        where: { deletedAt: null },
        _sum: { currentQuantity: true },
      }),
      this.prisma.batch.count({
        where: {
          expiryDate: { lte: expiryThreshold, gte: now },
          currentQuantity: { gt: 0 },
          deletedAt: null,
        },
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true, minimumStock: true },
      }),
      this.prisma.sale.findMany({
        where: {
          deletedAt: null,
          type: SaleType.SALE,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true },
      }),
      this.prisma.stockVoucher.findMany({
        where: {
          deletedAt: null,
          type: 'PURCHASE',
        },
        select: {
          id: true,
          voucherNumber: true,
          date: true,
          netAmount: true,
          supplier: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: 5,
      }),
    ]);

    const stockMap = new Map(
      stockByProduct.map((b) => [b.productId, b._sum.currentQuantity ?? 0]),
    );

    const lowStockCount = allProducts.filter((p) => {
      const qty = stockMap.get(p.id) ?? 0;
      return qty > 0 && qty <= p.minimumStock;
    }).length;

    const outOfStockCount = allProducts.filter(
      (p) => (stockMap.get(p.id) ?? 0) === 0,
    ).length;

    return {
      todaySales: {
        totalAmount: Number(todaySalesAgg._sum.netAmount ?? 0),
        count: todaySalesCount,
      },
      lowStockCount,
      nearExpiryCount,
      outOfStockCount,
      totalProducts: allProducts.length,
      recentSales: this.serializeRecentSales(recentSalesRaw),
      recentPurchases: this.serializeRecentPurchases(recentPurchasesRaw),
    };
  }

  private serializeRecentSales(sales: any[]): RecentSaleDto[] {
    return sales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      customerName: s.customerName,
      totalAmount: Number(s.netAmount),
      itemCount: s.items.length,
      createdAt: s.createdAt.toISOString(),
    }));
  }
  private serializeRecentPurchases(purchases: any[]): RecentPurchaseDto[] {
    return purchases.map((p) => ({
      id: p.id,
      voucherNumber: p.voucherNumber,
      distributorName: p.distributor?.name ?? null,
      totalAmount: Number(p.netAmount),
      itemCount: p._count.items,
      createdAt: p.date.toISOString(),
    }));
  }
}
