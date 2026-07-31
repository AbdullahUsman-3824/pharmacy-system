// packages/shared/src/dashboard.types.ts
export interface DashboardStatsDto {
  todaySales: {
    totalAmount: number;
    count: number;
  };
  lowStockCount: number;
  nearExpiryCount: number; // batches expiring within 30 days
  totalProducts: number;
  recentSales: RecentSaleDto[];
}

export interface RecentSaleDto {
  id: string;
  saleNumber: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}
