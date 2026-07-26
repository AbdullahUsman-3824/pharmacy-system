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
  confirmRateUpdate?: boolean;
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
  product: {
    id: string;
    name: string;
    code: string;
  };
  batch: {
    id: string;
    batchNumber: string;
    expiryDate?: string | null;
  };
}

export interface StockVoucherOutput {
  id: string;
  voucherNumber: string;
  type: StockVoucherType;
  supplierId: string | null;
  date: string;
  remarks?: string | null;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
  items: StockVoucherItemOutput[];
  supplier: {
    id: string;
    name: string;
    contactPerson?: string | null;
  };
}

export interface BatchStockLine {
  batchId: string;
  batchNumber: string;
  expiryDate?: string | null;
  currentQuantity: number;
  looseQuantity: number;
  purchaseRate: number;
  saleRate: number;
  packingSize: number;
}

export interface ProductStockView {
  productId: string;
  totalQuantity: number;
  batches: BatchStockLine[]; // FEFO order
}

export interface StockVoucherListItem {
  id: string;
  voucherNumber: string;
  type: StockVoucherType;
  date: string;
  supplierId: string | null;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  remarks?: string;
}
