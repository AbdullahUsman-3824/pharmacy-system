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

export const paymentSchema = z.object({
  paymentAccountId: z.string().min(1, "Payment account required"),
  amount: z.coerce.number().positive("Amount too low"),
});

export const stockVoucherFormSchema = z
  .object({
    type: z.nativeEnum(StockVoucherType),
    supplierId: z.string().optional().nullable(),
    voucherDate: z.string().min(1, "Date required"),
    remarks: z.string().optional(),
    payments: z.array(paymentSchema),
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
