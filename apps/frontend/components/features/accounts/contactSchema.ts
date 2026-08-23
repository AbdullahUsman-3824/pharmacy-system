import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type ContactFormInput = z.input<typeof contactSchema>;
export type ContactFormOutput = z.output<typeof contactSchema>;
