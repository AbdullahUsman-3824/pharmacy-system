// apps/frontend/components/products/productSchema.ts
import { z } from "zod";

const requiredString = (field: string) =>
  z.string().trim().min(1, `${field} is required`);

const optionalNumber = () =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().optional(),
  );

const optionalPositiveNumber = (field: string) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().positive(`${field} must be greater than 0`).optional(),
  );

const optionalPercentage = (field: string) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number()
      .min(0, `${field} cannot be less than 0`)
      .max(100, `${field} cannot be greater than 100`)
      .optional(),
  );

export const productSchema = z.object({
  code: requiredString("Code"),
  barcode: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  name: requiredString("Name"),
  companyId: requiredString("Company"),
  typeId: requiredString("Type"),
  groupId: z.string().optional().nullable(),
  genericId: z.string().optional().nullable(),
  defaultDistributorId: z.string().optional().nullable(),
  registrationNo: z.string().optional(),
  originalReference: z.string().optional(),

  packingSize: z.coerce.number().positive("Packing size must be positive"),

  retailPrice: optionalPositiveNumber("Retail price"),
  retailDiscount: optionalPercentage("Retail discount"),
  tradePrice: optionalNumber(),
  retailRate: optionalNumber(),
  tradeRate: optionalNumber(),
  counterRatePercent: optionalPercentage("Counter rate"),
  orgRatePercent: optionalPercentage("Organization rate"),

  minimumStock: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number()
      .int()
      .min(0, "Minimum stock cannot be negative")
      .optional(),
  ),

  maximumStock: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number()
      .int()
      .min(0, "Maximum stock cannot be negative")
      .optional(),
  ),

  shelfNo: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number()
      .int()
      .min(1, "Shelf number must be at least 1")
      .optional(),
  ),

  isActive: z.boolean().default(true),
  nivFormulary: z.boolean().default(false),
});

// Two distinct types: what the form fields hold vs. what submit gives you
export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormOutput = z.output<typeof productSchema>;
