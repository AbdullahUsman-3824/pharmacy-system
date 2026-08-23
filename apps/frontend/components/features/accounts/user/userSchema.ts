import { z } from "zod";
import { UserType } from "@repo/shared";

export function userSchema(mode: "create" | "edit") {
  return z
    .object({
      name: z.string().min(1, "Name is required"),
      pin: z.string().regex(/^\d*$/, "PIN must be numeric").optional(),
      type: z.nativeEnum(UserType),
      isActive: z.boolean().default(true),
    })
    .superRefine((data, ctx) => {
      if (mode === "create" && (!data.pin || data.pin.length < 4)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pin"],
          message: "PIN must be at least 4 digits",
        });
      }
    });
}

export interface UserFormInput {
  name: string;
  pin?: string;
  type: UserType;
  isActive?: boolean;
}

export interface UserFormOutput {
  name: string;
  pin?: string;
  type: UserType;
  isActive: boolean;
}
