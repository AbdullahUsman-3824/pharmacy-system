// apps/frontend/components/products/ProductForm.tsx
"use client";

import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productSchema,
  type ProductFormInput,
  type ProductFormOutput,
} from "./productSchema";
import { SelectWithQuickAdd } from "./SelectWithQuickAdd";
import { useLookup, useCreateLookup } from "@/hooks/useLookups";
import { LookupType, CreateProductInput } from "@repo/shared";

interface ProductFormProps {
  onSubmit: (values: CreateProductInput) => void;
  onCancel: () => void;
}

export function ProductForm({ onSubmit, onCancel }: ProductFormProps) {
  const { data: companies = [] } = useLookup(LookupType.Company);
  const { data: types = [] } = useLookup(LookupType.ProductType);
  const { data: groups = [] } = useLookup(LookupType.ProductGroup);
  const { data: generics = [] } = useLookup(LookupType.Generic);
  // const { data: suppliers = [] } = useLookup(LookupType.Supplier);

  const { mutate: createCompany } = useCreateLookup(LookupType.Company);
  const { mutate: createType } = useCreateLookup(LookupType.ProductType);
  const { mutate: createGroup } = useCreateLookup(LookupType.ProductGroup);
  const { mutate: createGeneric } = useCreateLookup(LookupType.Generic);
  // const { mutate: createSupplier } = useCreateLookup(LookupType.Supplier);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormInput, object, ProductFormOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: { isActive: true, nivFormulary: false, packingSize: 1 },
  });

  function submit(values: ProductFormOutput) {
    onSubmit(values);
  }

  const [packingSize, retailPrice, retailDiscount] = useWatch({
    control,
    name: ["packingSize", "retailPrice", "retailDiscount"],
  });

  useEffect(() => {
    const price = Number(retailPrice) || 0;
    const discount = Number(retailDiscount) || 0;
    const size = Number(packingSize) || 1;

    const tradePrice = price - (price * discount) / 100;
    const retailRate = size > 0 ? price / size : 0;
    const tradeRate = size > 0 ? tradePrice / size : 0;

    setValue("tradePrice", Number(tradePrice.toFixed(2)));
    setValue("retailRate", Number(retailRate.toFixed(2)));
    setValue("tradeRate", Number(tradeRate.toFixed(2)));
  }, [retailPrice, retailDiscount, packingSize, setValue]);

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-3 ">
          <Controller
            name="companyId"
            control={control}
            render={({ field }) => (
              <SelectWithQuickAdd
                label="Company *"
                placeholder="Select company"
                options={companies}
                value={field.value ?? null}
                onChange={field.onChange}
                onQuickAdd={(n) =>
                  createCompany(n, { onSuccess: (c) => field.onChange(c.id) })
                }
              />
            )}
          />
          {errors.companyId && (
            <p className="text-xs text-danger-strong">
              {errors.companyId.message}
            </p>
          )}

          <Controller
            name="typeId"
            control={control}
            render={({ field }) => (
              <SelectWithQuickAdd
                label="Type *"
                placeholder="Select type"
                options={types}
                value={field.value ?? null}
                onChange={field.onChange}
                onQuickAdd={(n) =>
                  createType(n, { onSuccess: (t) => field.onChange(t.id) })
                }
              />
            )}
          />
          {errors.typeId && (
            <p className="text-xs text-danger-strong">
              {errors.typeId.message}
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm text-ink-500">Code *</label>
            <input
              {...register("code")}
              placeholder="Product code"
              className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
            />
            {errors.code && (
              <p className="text-xs text-danger-strong">
                {errors.code.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-ink-500">Name *</label>
            <input
              {...register("name")}
              placeholder="e.g. Panadol 500mg"
              className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
            />
            {errors.name && (
              <p className="text-xs text-danger-strong">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-ink-500">Barcode</label>
            <input
              {...register("barcode")}
              className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>

          <Controller
            name="groupId"
            control={control}
            render={({ field }) => (
              <SelectWithQuickAdd
                label="Group"
                placeholder="Select group"
                options={groups}
                value={field.value ?? null}
                onChange={field.onChange}
                onQuickAdd={(n) =>
                  createGroup(n, { onSuccess: (g) => field.onChange(g.id) })
                }
              />
            )}
          />
          <Controller
            name="genericId"
            control={control}
            render={({ field }) => (
              <SelectWithQuickAdd
                label="Generic"
                placeholder="Select generic"
                options={generics}
                value={field.value ?? null}
                onChange={field.onChange}
                onQuickAdd={(n) =>
                  createGeneric(n, { onSuccess: (g) => field.onChange(g.id) })
                }
              />
            )}
          />
          {/* <Controller
            name="defaultSupplierId"
            control={control}
            render={({ field }) => (
              <SelectWithQuickAdd
                label="Distributor"
                placeholder="Select supplier"
                options={suppliers}
                value={field.value ?? null}
                onChange={field.onChange}
                onQuickAdd={(n) => createSupplier(n, { onSuccess: (s) => field.onChange(s.id) })}
              />
            )}
          /> */}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border-soft p-4 relative">
            <p className="mb-3 text-sm font-semibold text-ink-700 absolute -top-3 bg-surface-page px-2">
              Packing
            </p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-ink-500">
                    Size *
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    {...register("packingSize", {
                      valueAsNumber: true,
                      min: {
                        value: 1,
                        message: "Packing size must be greater than 0",
                      },
                    })}
                    className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm focus:outline-none"
                  />
                  {errors.packingSize && (
                    <p className="text-xs text-danger-strong">
                      {errors.packingSize.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-500">
                    Retail Price
                  </label>
                  <input
                    type="number"
                    {...register("retailPrice")}
                    className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-ink-500">
                    Retail Dis. %
                  </label>
                  <input
                    type="number"
                    max={100}
                    {...register("retailDiscount")}
                    className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-500">
                    Trade Price
                  </label>
                  <input
                    type="number"
                    readOnly
                    {...register("tradePrice")}
                    className="w-full rounded-lg border border-border bg-gray-100 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border-soft p-4 relative mt-2">
            <p className="mb-3 text-sm font-semibold text-ink-700 absolute -top-3 bg-surface-page px-2">
              Unit Rate
            </p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-ink-500">
                    Retail Rate
                  </label>
                  <input
                    type="number"
                    readOnly
                    {...register("retailRate")}
                    className="w-full rounded-lg border border-border bg-gray-100 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-500">
                    Trade Rate
                  </label>
                  <input
                    type="number"
                    readOnly
                    {...register("tradeRate")}
                    className="w-full rounded-lg border border-border bg-gray-100 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-ink-500">
                    Counter Rate %
                  </label>
                  <input
                    type="number"
                    {...register("counterRatePercent")}
                    className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-500">
                    Org. Rate %
                  </label>
                  <input
                    type="number"
                    {...register("orgRatePercent")}
                    className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border-soft p-4 relative mt-2">
            <p className="mb-3 text-sm font-semibold text-ink-700 absolute -top-3 bg-surface-page px-2">
              Additional Details
            </p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-ink-500">
                    Reg. No.
                  </label>
                  <input
                    {...register("registrationNo")}
                    className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-ink-500">
                    Org. Ref.
                  </label>
                  <input
                    {...register("originalReference")}
                    className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-ink-500">
                    Min. Level
                  </label>
                  <input
                    type="number"
                    {...register("minimumStock")}
                    className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-ink-500">
                    Max. Level
                  </label>
                  <input
                    type="number"
                    {...register("maximumStock")}
                    className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-ink-500">
                    Shelf No.
                  </label>
                  <input
                    type="number"
                    {...register("shelfNo")}
                    className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end gap-2 pb-1">
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <input type="checkbox" {...register("nivFormulary")} />
                    NIV Formulary
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <input type="checkbox" {...register("isActive")} />
                    Active
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-3 pt-2">
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
          Save Product
        </button>
      </div>
    </form>
  );
}
