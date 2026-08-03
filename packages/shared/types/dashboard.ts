import type { StockVoucherListItem } from "./stock";

export interface DashboardStatsDto {
  todaySales: {
    totalAmount: number;
    count: number;
  };
  lowStockCount: number;
  nearExpiryCount: number;
  outOfStockCount: number;
  totalProducts: number;
  recentSales: RecentSaleDto[];
  recentPurchases: RecentPurchaseDto[];
}

export interface RecentSaleDto {
  id: string;
  saleNumber: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

export interface RecentPurchaseDto {
  id: string;
  voucherNumber: string;
  supplierName: string | null;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}
