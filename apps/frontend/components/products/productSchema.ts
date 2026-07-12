// apps/frontend/components/products/productSchema.ts
import { z } from "zod";

export const productSchema = z.object({
  code: z.string().min(1, "Code is required"),
  barcode: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  companyId: z.string().min(1, "Company is required"),
  typeId: z.string().min(1, "Type is required"),
  groupId: z.string().optional().nullable(),
  genericId: z.string().optional().nullable(),
  defaultSupplierId: z.string().optional().nullable(),
  registrationNo: z.string().optional(),
  originalReference: z.string().optional(),
  packingSize: z.coerce.number().positive("Packing size must be positive"),
  retailPrice: z.coerce.number().positive().optional(),
  retailDiscount: z.coerce.number().min(0).max(100).optional(),
  tradePrice: z.coerce.number().positive().optional(),
  retailRate: z.coerce.number().positive().optional(),
  tradeRate: z.coerce.number().positive().optional(),
  counterRatePercent: z.coerce.number().min(0).max(100).optional(),
  orgRatePercent: z.coerce.number().min(0).max(100).optional(),
  minimumStock: z.coerce.number().int().min(0).optional(),
  maximumStock: z.coerce.number().int().min(0).optional(),
  shelfNo: z.coerce.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
  nivFormulary: z.boolean().default(false),
});

// two distinct types: what the form fields hold vs. what submit gives you
export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormOutput = z.output<typeof productSchema>;
