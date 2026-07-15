export enum StockVoucherType {
  OPENING = "OPENING",
  PURCHASE = "PURCHASE",
  PURCHASE_RETURN = "PURCHASE_RETURN",
  STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT",
  STOCK_TRANSFER = "STOCK_TRANSFER",
}

export interface StockVoucherItemInput {
  productId: string;
  batchNumber: string;
  expiryDate?: string | null;
  quantity: number;
  freeQuantity?: number;
  purchaseRate: number;
  saleRate: number;
  grossAmount: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  netAmount: number;
}

export interface CreateStockVoucherInput {
  type: StockVoucherType;
  supplierId?: string | null;
  voucherDate: string;
  remarks?: string;
  items: StockVoucherItemInput[];
}

export interface StockVoucherItemOutput {
  id: string;
  productId: string;
  batchId: string;
  batchNumber: string;
  expiryDate?: string | null;
  quantity: number;
  freeQuantity: number;
  purchaseRate: number;
  saleRate: number;
  grossAmount: number;
  discountPercent?: number;
  discountAmount: number;
  taxPercent?: number;
  taxAmount: number;
  netAmount: number;
}

export interface StockVoucherOutput {
  id: string;
  voucherNumber: string;
  type: StockVoucherType;
  supplierId: string | null;
  voucherDate: string;
  remarks?: string | null;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
  items: StockVoucherItemOutput[]; // fixed: was Input[]
}

export interface BatchStockLine {
  batchId: string;
  batchNumber: string;
  expiryDate?: string | null;
  currentQuantity: number;
  purchaseRate: number;
  saleRate: number;
}

export interface ProductStockView {
  productId: string;
  totalQuantity: number;
  batches: BatchStockLine[]; // FEFO order
}
