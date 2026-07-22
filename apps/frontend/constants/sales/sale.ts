import { SaleType } from "@repo/shared";

export const defaultSaleItemRow = {
  productId: "",
  batchId: "",
  batchNumber: "",
  expiryDate: "",
  quantity: 0,
  saleRate: 0,
  discountPercent: 0,
  taxPercent: 0,
};

export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  [SaleType.SALE]: "Sale",
  [SaleType.SALE_RETURN]: "Sale Return",
};

export const DEFAULT_CUSTOMER_NAME = "Walk-in Customer";
