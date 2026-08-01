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
import { useLookup, useCreateLookup } from "@/hooks/useLookups";
import { useSuppliers } from "@/hooks/useSuppliers";
import { LookupType, CreateProductInput, ProductDto } from "@repo/shared";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import Input from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-section";
import { LookupSelect } from "@/components/ui/lookup-select";

export type ProductFormMode = "create" | "edit" | "view";

interface ProductFormProps {
  mode?: ProductFormMode;
  initialData?: ProductDto;
  onSubmit: (values: CreateProductInput) => void | Promise<void>;
  onCancel: () => void;
}

const DEFAULT_VALUES: Partial<ProductFormInput> = {
  isActive: true,
  nivFormulary: false,
  packingSize: 1,
};

function toLookupOptions(items: Array<{ id: string; name: string }>) {
  return items.map((item) => ({
    value: item.id,
    label: item.name,
  }));
}

export function ProductForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const isReadOnly = mode === "view";

  const { data: companies = [] } = useLookup(LookupType.Company);
  const { data: types = [] } = useLookup(LookupType.ProductType);
  const { data: groups = [] } = useLookup(LookupType.ProductGroup);
  const { data: generics = [] } = useLookup(LookupType.Generic);
  const { data: suppliers = [] } = useSuppliers();

  const { mutate: createCompany } = useCreateLookup(LookupType.Company);
  const { mutate: createType } = useCreateLookup(LookupType.ProductType);
  const { mutate: createGroup } = useCreateLookup(LookupType.ProductGroup);
  const { mutate: createGeneric } = useCreateLookup(LookupType.Generic);

  const companyOptions = toLookupOptions(companies);
  const typeOptions = toLookupOptions(types);
  const groupOptions = toLookupOptions(groups);
  const genericOptions = toLookupOptions(generics);
  const supplierOptions = toLookupOptions(suppliers);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormInput, object, ProductFormOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ?? DEFAULT_VALUES,
  });

  // Repopulate the form whenever initialData arrives/changes
  // (covers async-fetched data for edit/view modes)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  async function submit(values: ProductFormOutput) {
    if (isReadOnly) return;

    try {
      await onSubmit(values);
      reset();
    } catch {
      // Keep values intact so the user can fix the error.
    }
  }

  const [packingSize, retailPrice, retailDiscount] = useWatch({
    control,
    name: ["packingSize", "retailPrice", "retailDiscount"],
  });

  useEffect(() => {
    if (isReadOnly) return;

    const price = Number(retailPrice) || 0;
    const discount = Number(retailDiscount) || 0;
    const size = Number(packingSize) || 1;

    const tradePrice = price - (price * discount) / 100;
    const retailRate = size > 0 ? price / size : 0;
    const tradeRate = size > 0 ? tradePrice / size : 0;

    setValue("tradePrice", Number(tradePrice.toFixed(2)));
    setValue("retailRate", Number(retailRate.toFixed(2)));
    setValue("tradeRate", Number(tradeRate.toFixed(2)));
  }, [retailPrice, retailDiscount, packingSize, setValue, isReadOnly]);

  return (
    <form
      onSubmit={handleSubmit(submit, (errors) => {
        console.log("Validation Errors:", errors);
      })}
      className="flex flex-col gap-2"
    >
      <fieldset disabled={isReadOnly} className="contents">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <FormSection
              title="Product identity"
              description="Core lookup values and identifiers for the catalog record."
            >
              <div className="space-y-4">
                <Controller
                  name="companyId"
                  control={control}
                  render={({ field }) => (
                    <LookupSelect
                      label="Company *"
                      placeholder="Select company"
                      options={companyOptions}
                      value={field.value ?? null}
                      onChange={field.onChange}
                      error={errors.companyId?.message}
                      disabled={isReadOnly}
                      onQuickAdd={(name) =>
                        createCompany(name, {
                          onSuccess: (company) => field.onChange(company.id),
                        })
                      }
                    />
                  )}
                />

                <Controller
                  name="typeId"
                  control={control}
                  render={({ field }) => (
                    <LookupSelect
                      label="Type *"
                      placeholder="Select type"
                      options={typeOptions}
                      value={field.value ?? null}
                      onChange={field.onChange}
                      error={errors.typeId?.message}
                      disabled={isReadOnly}
                      onQuickAdd={(name) =>
                        createType(name, {
                          onSuccess: (type) => field.onChange(type.id),
                        })
                      }
                    />
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Code *"
                    placeholder="Product code"
                    error={errors.code?.message}
                    {...register("code")}
                  />
                  <Input
                    label="Name *"
                    placeholder="e.g. Panadol 500mg"
                    error={errors.name?.message}
                    {...register("name")}
                  />
                </div>

                <Input
                  label="Barcode"
                  error={errors.barcode?.message}
                  {...register("barcode")}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    name="groupId"
                    control={control}
                    render={({ field }) => (
                      <LookupSelect
                        label="Group"
                        placeholder="Select group"
                        options={groupOptions}
                        value={field.value ?? null}
                        onChange={field.onChange}
                        error={errors.groupId?.message}
                        disabled={isReadOnly}
                        onQuickAdd={(name) =>
                          createGroup(name, {
                            onSuccess: (group) => field.onChange(group.id),
                          })
                        }
                      />
                    )}
                  />

                  <Controller
                    name="genericId"
                    control={control}
                    render={({ field }) => (
                      <LookupSelect
                        label="Generic"
                        placeholder="Select generic"
                        options={genericOptions}
                        value={field.value ?? null}
                        onChange={field.onChange}
                        error={errors.genericId?.message}
                        disabled={isReadOnly}
                        onQuickAdd={(name) =>
                          createGeneric(name, {
                            onSuccess: (generic) => field.onChange(generic.id),
                          })
                        }
                      />
                    )}
                  />
                </div>

                <Controller
                  name="defaultSupplierId"
                  control={control}
                  render={({ field }) => (
                    <LookupSelect
                      label="Supplier"
                      placeholder="Select supplier"
                      options={supplierOptions}
                      value={field.value ?? null}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                    />
                  )}
                />
              </div>
            </FormSection>

            <FormSection
              title="Catalog details"
              description="Reference data that appears on product and invoice records."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Reg. No." {...register("registrationNo")} />
                <Input label="Org. Ref." {...register("originalReference")} />
              </div>
            </FormSection>
          </div>

          <div className="space-y-6">
            <FormSection
              title="Packing & pricing"
              description="Pack size and the derived retail/trade pricing fields."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  label="Size *"
                  min={1}
                  step={1}
                  error={errors.packingSize?.message}
                  {...register("packingSize", {
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "Packing size must be greater than 0",
                    },
                  })}
                />

                <Input
                  type="number"
                  label="Retail Price"
                  step="any"
                  error={errors.retailPrice?.message}
                  {...register("retailPrice")}
                />

                <Input
                  type="number"
                  label="Retail Dis. %"
                  min={0}
                  max={100}
                  step="any"
                  error={errors.retailDiscount?.message}
                  {...register("retailDiscount")}
                />

                <Input
                  type="number"
                  label="Trade Price"
                  readOnly
                  error={errors.tradePrice?.message}
                  className="bg-[var(--color-background-muted)] text-[var(--color-text-secondary)]"
                  {...register("tradePrice")}
                />

                <Input
                  type="number"
                  label="Retail Rate"
                  readOnly
                  error={errors.retailRate?.message}
                  className="bg-[var(--color-background-muted)] text-[var(--color-text-secondary)]"
                  {...register("retailRate")}
                />

                <Input
                  type="number"
                  label="Trade Rate"
                  readOnly
                  error={errors.tradeRate?.message}
                  className="bg-[var(--color-background-muted)] text-[var(--color-text-secondary)]"
                  {...register("tradeRate")}
                />

                <Input
                  type="number"
                  label="Counter Rate %"
                  min={0}
                  max={100}
                  step="any"
                  error={errors.counterRatePercent?.message}
                  {...register("counterRatePercent")}
                />

                <Input
                  type="number"
                  label="Org. Rate %"
                  min={0}
                  max={100}
                  step="any"
                  error={errors.orgRatePercent?.message}
                  {...register("orgRatePercent")}
                />
              </div>
            </FormSection>

            <FormSection
              title="Inventory & flags"
              description="Stock limits and product availability controls."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  label="Min. Level"
                  min={0}
                  step={1}
                  error={errors.minimumStock?.message}
                  {...register("minimumStock")}
                />
                <Input
                  type="number"
                  label="Max. Level"
                  min={0}
                  step={1}
                  error={errors.maximumStock?.message}
                  {...register("maximumStock")}
                />
                <Input
                  type="number"
                  label="Shelf No."
                  min={1}
                  step={1}
                  error={errors.shelfNo?.message}
                  {...register("shelfNo")}
                />

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-background-muted)]/40 p-4">
                  <div className="space-y-3">
                    <Checkbox
                      label="NIV Formulary"
                      {...register("nivFormulary")}
                    />
                    <Checkbox label="Active" {...register("isActive")} />
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        </div>
      </fieldset>

      <div className="mt-1 flex flex-col gap-3 border-t border-[var(--color-border-light)] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" onClick={onCancel} variant="outline">
          {isReadOnly ? "Close" : "Cancel"}
        </Button>
        {!isReadOnly && (
          <Button type="submit" variant="primary">
            {mode === "edit" ? "Update Product" : "Save Product"}
          </Button>
        )}
      </div>
    </form>
  );
}
