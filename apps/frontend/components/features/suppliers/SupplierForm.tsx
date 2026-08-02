"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Supplier Name"
              placeholder="Supplier / company name"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          <Input
            label="Contact Person"
            error={errors.contactPerson?.message}
            {...register("contactPerson")}
          />

          <Input
            label="Email"
            type="email"
            placeholder="name@company.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Phone"
            error={errors.phone?.message}
            {...register("phone")}
          />

          <Input
            label="Mobile"
            error={errors.mobile?.message}
            {...register("mobile")}
          />

          <div className="md:col-span-2">
            <Input
              label="Address"
              error={errors.address?.message}
              {...register("address")}
            />
          </div>

          <Input
            label="City"
            error={errors.city?.message}
            {...register("city")}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>

        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
