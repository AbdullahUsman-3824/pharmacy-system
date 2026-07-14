"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, type SupplierFormValues } from "./supplierSchema";

interface SupplierFormProps {
  defaultValues?: Partial<SupplierFormValues>;
  onSubmit: (values: SupplierFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function SupplierForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save Supplier",
}: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm text-ink-500">Name *</label>
        <input
          {...register("name")}
          placeholder="Supplier / company name"
          className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
        />
        {errors.name && <p className="mt-1 text-xs text-danger-strong">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="mb-1.5 block text-sm text-ink-500">Contact Person</label>
          <input
            {...register("contactPerson")}
            className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-500">Email</label>
          <input
            {...register("email")}
            placeholder="name@company.com"
            className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
          />
          {errors.email && <p className="mt-1 text-xs text-danger-strong">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-500">Phone</label>
          <input
            {...register("phone")}
            className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-500">Mobile</label>
          <input
            {...register("mobile")}
            className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1.5 block text-sm text-ink-500">Address</label>
          <input
            {...register("address")}
            className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-500">City</label>
          <input
            {...register("city")}
            className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-3 border-t border-border-soft pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-sunken"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}