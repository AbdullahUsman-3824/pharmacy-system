import { PaginatedResult } from "../query/paginated-result";
import { CreatePaymentDto, PaymentOutput } from "./accounts";

export enum StockVoucherType {
  OPENING = "OPENING",
  PURCHASE = "PURCHASE",
  PURCHASE_RETURN = "PURCHASE_RETURN",
  STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT",
  STOCK_TRANSFER = "STOCK_TRANSFER",
}

// ======================================================
// Shared summary shapes (reused across outputs)
// ======================================================

export interface ProductSummary {
  id: string;
  name: string;
  code: string;
}

export interface BatchSummary {
  id: string;
  batchNumber: string;
  expiryDate?: string | null;
}

// ======================================================
// Stock Voucher Item — shared base between input/output
// ======================================================

interface StockVoucherItemBase {
  productId: string;
  batchNumber: string;
  expiryDate?: string | null;
  packQuantity: number;
  looseQuantity: number;
  purchaseRate: number;
  saleRate: number;
  grossAmount: number;
  discountPercent?: number;
  taxPercent?: number;
  netAmount: number;
}

export interface StockVoucherItemInput extends StockVoucherItemBase {
  freeQuantity?: number;
  discountAmount?: number;
  taxAmount?: number;
  confirmRateUpdate?: boolean;
}

export interface StockVoucherItemOutput extends StockVoucherItemBase {
  id: string;
  batchId: string;
  freeQuantity: number;
  discountAmount: number;
  taxAmount: number;
  product: ProductSummary;
  batch: BatchSummary;
}

// ======================================================
// Stock Voucher — shared base between input/output
// ======================================================

interface StockVoucherBase {
  type: StockVoucherType;
  supplierId?: string | null;
  remarks?: string | null;
}

export interface CreateStockVoucherInput extends StockVoucherBase {
  voucherDate: string;
  creatorPin: string;
  items: StockVoucherItemInput[];
  payments: CreatePaymentDto[];
}

export interface StockVoucherOutput extends StockVoucherBase {
  id: string;
  voucherNumber: string;
  date: string;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
  items: StockVoucherItemOutput[];
  supplier: string | null;
  createdByName: string | null;
  payments: PaymentOutput[];
}

// ======================================================
// Batch / Product stock views
// ======================================================

export interface BatchStockLine {
  batchId: string;
  batchNumber: string;
  expiryDate?: string | null;
  currentQuantity: number;
  packingSize: number;
  purchaseRate: number;
  saleRate: number;
}

export interface ProductStockView {
  productId: string;
  totalQuantity: number;
  batches: BatchStockLine[];
}

// ======================================================
// Stock Voucher list view
// ======================================================

export interface StockVoucherListItem {
  id: string;
  voucherNumber: string;
  type: StockVoucherType;
  date: string;
  supplierId: string | null;
  supplierName: string | null;
  itemCount: number;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  remarks?: string | null;
}

export interface StockVoucherListResponse extends PaginatedResult<StockVoucherListItem> {}
