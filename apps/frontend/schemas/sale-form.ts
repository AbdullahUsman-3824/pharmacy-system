import { z } from "zod";

export const saleItemSchema = z
  .object({
    productId: z.string().min(1, "Product required"),
    productName: z.string().optional(),
    batchId: z.string().min(1, "Batch required"),
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional().nullable(),
    packingSize: z.coerce.number().positive().default(1),
    packQuantity: z.coerce.number().int().min(0).default(0),
    looseQuantity: z.coerce.number().int().min(0).default(0),
    saleRate: z.coerce.number().min(0, "Rate too low"),
  })
  .refine((data) => data.packQuantity > 0 || data.looseQuantity > 0, {
    message: "Enter a pack or loose quantity",
    path: ["packQuantity"],
  });

const paymentSchema = z.object({
  paymentAccountId: z.string().min(1, "Payment account required"),
  amount: z.coerce.number().positive("Amount too low"),
});

export const saleFormSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().default("Walk-in Customer"),
  saleDate: z.string().min(1, "Date required"),
  remarks: z.string().optional(),

  // bill-level discount/tax — applied once on the invoice total
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  taxPercent: z.coerce.number().min(0).max(100).default(0),
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
  payments: z.array(paymentSchema).min(1, "Add at least one payment"),
});

export type SaleFormInput = z.input<typeof saleFormSchema>;
export type SaleFormOutput = z.output<typeof saleFormSchema>;
export type SaleItemValues = z.output<typeof saleItemSchema>;
