// components/features/accounts/ContactForm.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactSchema,
  type ContactFormInput,
  type ContactFormOutput,
} from "./contactSchema";
import { BusinessContact } from "@repo/shared";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import Input from "@/components/ui/input";

export type ContactFormMode = "create" | "edit";

interface ContactFormProps {
  mode: ContactFormMode;
  entityLabel: string; // "Customer" | "Supplier"
  initialData?: BusinessContact;
  onSubmit: (values: ContactFormOutput) => void | Promise<void>;
  onCancel: () => void;
}

const DEFAULT_VALUES: Partial<ContactFormInput> = {
  isActive: true,
};

function toFormValues(contact?: BusinessContact): Partial<ContactFormInput> {
  if (!contact) return DEFAULT_VALUES;
  return {
    name: contact.name,
    phone: contact.phone ?? undefined,
    address: contact.address ?? undefined,
    isActive: contact.isActive,
  };
}

export function ContactForm({
  mode,
  entityLabel,
  initialData,
  onSubmit,
  onCancel,
}: ContactFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormInput, object, ContactFormOutput>({
    resolver: zodResolver(contactSchema),
    defaultValues: toFormValues(initialData),
  });

  useEffect(() => {
    if (initialData) {
      reset(toFormValues(initialData));
    }
  }, [initialData, reset]);

  async function submit(values: ContactFormOutput) {
    try {
      await onSubmit(values);
      reset();
    } catch {
      // Keep values intact so the user can fix the error.
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Input
        label="Name *"
        placeholder={`e.g. ${entityLabel === "Customer" ? "Ahmed Traders" : "ABC Distributors"}`}
        error={errors.name?.message}
        {...register("name")}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Phone"
          placeholder="03xx-xxxxxxx"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Address"
          error={errors.address?.message}
          {...register("address")}
        />
      </div>

      <Checkbox label="Active" {...register("isActive")} />

      <div className="mt-1 flex flex-col gap-3 border-t border-[var(--color-border-light)] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {mode === "edit" ? `Update ${entityLabel}` : `Save ${entityLabel}`}
        </Button>
      </div>
    </form>
  );
}
