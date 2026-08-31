import { z } from "zod";

export const returnLineSchema = z
  .object({
    productId: z.string(),
    productName: z.string().optional(),
    batchId: z.string(),
    batchNumber: z.string().optional(),
    saleRate: z.number(),
    packingSize: z.number().min(1),
    maxPacks: z.number(),
    maxLoose: z.number(),
    maxUnits: z.number(),
    packQuantity: z.coerce.number().min(0).default(0),
    looseQuantity: z.coerce.number().min(0).default(0),
  })
  .refine(
    (line) => {
      const units = line.packQuantity * line.packingSize + line.looseQuantity;
      return units <= line.maxUnits;
    },
    {
      message: "Total return quantity exceeds available units",
      path: ["packQuantity"],
    },
  );
export const saleReturnFormSchema = z.object({
  originalSaleId: z.string().min(1, "Original sale required"),
  customerId: z.string().nullable().optional(),
  customerName: z.string().optional(),
  remarks: z.string().optional(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  taxPercent: z.coerce.number().min(0).max(100).default(0),
  lines: z.array(returnLineSchema),
});

export type ReturnLineValues = z.infer<typeof returnLineSchema>;
export type SaleReturnFormInput = z.input<typeof saleReturnFormSchema>;
export type SaleReturnFormOutput = z.output<typeof saleReturnFormSchema>;
