import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto, RecentSaleDto } from '@repo/shared';

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
    ] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          deletedAt: null,
        },
        _sum: { netAmount: true },
      }),
      this.prisma.sale.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          deletedAt: null,
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
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: true },
      }),
    ]);

    const stockMap = new Map(
      stockByProduct.map((b) => [b.productId, b._sum.currentQuantity ?? 0]),
    );

    const lowStockCount = allProducts.filter(
      (p) => (stockMap.get(p.id) ?? 0) <= p.minimumStock,
    ).length;

    return {
      todaySales: {
        totalAmount: Number(todaySalesAgg._sum.netAmount ?? 0),
        count: todaySalesCount,
      },
      lowStockCount,
      nearExpiryCount,
      totalProducts: allProducts.length,
      recentSales: this.serializeRecentSales(recentSalesRaw),
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
}
