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
  batches: InventoryBatchDto[];
}

export interface InventoryBatchDto {
  batchId: string;
  batchNumber: string;
  expiryDate: string | null;
  currentQuantity: number;
  purchaseRate: number | null;
  saleRate: number | null;
}

export interface InventoryListResponse {
  items: InventoryProductDto[];
  total: number;
  page: number;
  pageSize: number;
  totalQuantitySum: number;
  totalStockValue: number;
}

export interface InventoryListQuery {
  search?: string;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  nearExpiryOnly?: boolean;
  groupId?: string;
  typeId?: string;
  sortBy?: "name" | "totalQuantity" | "nearestExpiryDate" | "retailRate";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
