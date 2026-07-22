import { StockVoucherType } from "@repo/shared";


export const VOUCHER_TYPE_LABELS: Record<StockVoucherType, string> = {
  [StockVoucherType.PURCHASE]: "Purchase",
  [StockVoucherType.OPENING]: "Opening",
  [StockVoucherType.PURCHASE_RETURN]: "Purchase Return",
  [StockVoucherType.STOCK_ADJUSTMENT]: "Stock Adjustment",
  [StockVoucherType.STOCK_TRANSFER]: "Stock Transfer",
};

// Only these two are wired to real backend business logic today
export const IMPLEMENTED_VOUCHER_TYPES = new Set([
  StockVoucherType.OPENING,
  StockVoucherType.PURCHASE,
]);
