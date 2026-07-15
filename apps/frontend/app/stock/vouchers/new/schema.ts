import { z } from "zod";
import { StockVoucherType } from "@repo/shared";

export const itemSchema = z.object({
  productId: z.string().min(1, "Product required"),
  batchNumber: z.string().min(1, "Batch # required"),
  expiryDate: z.string().optional().nullable(),
  quantity: z.coerce.number().positive("Qty too low"),
  freeQuantity: z.coerce.number().min(0).default(0),
  purchaseRate: z.coerce.number().positive("Rate too low"),
  saleRate: z.coerce.number().positive("Sale rate too low"),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  taxPercent: z.coerce.number().min(0).max(100).default(0),
});

export const stockVoucherFormSchema = z
  .object({
    type: z.nativeEnum(StockVoucherType),
    supplierId: z.string().optional().nullable(),
    voucherDate: z.string().min(1, "Date required"),
    remarks: z.string().optional(),
    items: z.array(itemSchema).min(1, "Add at least one item"),
  })
  .superRefine((data, ctx) => {
    if (data.type === StockVoucherType.PURCHASE && !data.supplierId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supplierId"],
        message: "Supplier required for Purchase voucher",
      });
    }
  });

export type StockVoucherFormInput = z.input<typeof stockVoucherFormSchema>;
export type StockVoucherFormOutput = z.output<typeof stockVoucherFormSchema>;
export type StockVoucherItemValues = z.output<typeof itemSchema>;

export const defaultItemRow = {
  productId: "",
  batchNumber: "",
  expiryDate: "",
  quantity: 0,
  freeQuantity: 0,
  purchaseRate: 0,
  saleRate: 0,
  discountPercent: 0,
  taxPercent: 0,
};

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
