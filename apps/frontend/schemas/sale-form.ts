import { z } from "zod";
import { SaleType } from "@repo/shared";

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Product required"),
  productName: z.string().optional(),
  batchId: z.string().min(1, "Batch required"),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  quantity: z.coerce.number().positive("Qty too low"),
  saleRate: z.coerce.number().positive("Rate too low"),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  taxPercent: z.coerce.number().min(0).max(100).default(0),
});

export const saleFormSchema = z
  .object({
    type: z.nativeEnum(SaleType),
    customerName: z.string().default("Walk-in Customer"),
    saleDate: z.string().min(1, "Date required"),
    originalSaleId: z.string().optional().nullable(),
    remarks: z.string().optional(),
    items: z.array(saleItemSchema).min(1, "Add at least one item"),
  })
  .superRefine((data, ctx) => {
    if (data.type === SaleType.SALE_RETURN && !data.originalSaleId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["originalSaleId"],
        message: "Original sale required for a return",
      });
    }
  });

export type SaleFormInput = z.input<typeof saleFormSchema>;
export type SaleFormOutput = z.output<typeof saleFormSchema>;
export type SaleItemValues = z.output<typeof saleItemSchema>;
