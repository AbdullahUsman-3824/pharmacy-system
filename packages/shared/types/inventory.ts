import { PaginatedResult } from "../query/paginated-result";
export interface InventoryProductDto {
  productId: string;
  code: string;
  barcode: string | null;
  name: string;
  shelfNo: number | null;
  groupName: string | null;
  genericName: string | null;
  totalQuantity: number;
  retailRate: number | null;
  minimumStock: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  nearestExpiryDate: string | null;
  hasNearExpiryBatch: boolean;
  batchCount: number;
}

export interface InventoryBatchDto {
  batchId: string;
  batchNumber: string;
  expiryDate: string | null;
  currentQuantity: number;
  purchaseRate: number | null;
  saleRate: number | null;
}

export interface InventoryListResponse extends PaginatedResult<InventoryProductDto> {
  summary: {
    totalQuantitySum: number;
    totalStockValue: number;
  };
}

export enum InventoryStatus {
  LOW_STOCK = "LOW_STOCK",
  NEAR_EXPIRY = "NEAR_EXPIRY",
  OUT_OF_STOCK = "OUT_OF_STOCK",
}
