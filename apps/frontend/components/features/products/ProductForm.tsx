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
import { useCreateLookup, useLookupsOptions } from "@/hooks/useLookups";
import { useDistributorsOptions } from "@/hooks/useDistributors";
import { LookupType, CreateProductInput, ProductDto } from "@repo/shared";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import Input from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-section";
import { AsyncSelect } from "@/components/ui/async-select";

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

export function ProductForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const isReadOnly = mode === "view";

  const { mutate: createCompany } = useCreateLookup(LookupType.Company);
  const { mutate: createType } = useCreateLookup(LookupType.ProductType);
  const { mutate: createGroup } = useCreateLookup(LookupType.ProductGroup);
  const { mutate: createGeneric } = useCreateLookup(LookupType.Generic);

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
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    name="companyId"
                    control={control}
                    render={({ field }) => (
                      <AsyncSelect
                        label="Company *"
                        placeholder="Search company"
                        value={field.value ?? null}
                        selectedLabel={initialData?.company?.name}
                        onChange={(id) => field.onChange(id)}
                        useOptions={(search) =>
                          useLookupsOptions(LookupType.Company, search)
                        }
                        error={errors.companyId?.message}
                        disabled={isReadOnly}
                        onQuickAdd={(name, onCreated) =>
                          createCompany(name, {
                            onSuccess: (company) => {
                              field.onChange(company.id);
                              onCreated(company);
                            },
                          })
                        }
                      />
                    )}
                  />

                  <Controller
                    name="typeId"
                    control={control}
                    render={({ field }) => (
                      <AsyncSelect
                        label="Type *"
                        placeholder="Select type"
                        value={field.value ?? null}
                        selectedLabel={initialData?.type?.name}
                        onChange={(id) => field.onChange(id)}
                        useOptions={(search) =>
                          useLookupsOptions(LookupType.ProductType, search)
                        }
                        error={errors.typeId?.message}
                        disabled={isReadOnly}
                        onQuickAdd={(name, onCreated) =>
                          createType(name, {
                            onSuccess: (type) => {
                              field.onChange(type.id);
                              onCreated(type);
                            },
                          })
                        }
                      />
                    )}
                  />
                </div>

                <Input
                  label="Name *"
                  placeholder="e.g. Panadol 500mg"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Product Code *"
                    placeholder="e.g. PRC-123456"
                    error={errors.code?.message}
                    {...register("code")}
                  />
                  <Input
                    label="Barcode"
                    error={errors.barcode?.message}
                    {...register("barcode")}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    name="groupId"
                    control={control}
                    render={({ field }) => (
                      <AsyncSelect
                        label="Group *"
                        placeholder="Select group"
                        value={field.value ?? null}
                        selectedLabel={initialData?.group?.name}
                        onChange={(id) => field.onChange(id)}
                        useOptions={(search) =>
                          useLookupsOptions(LookupType.ProductGroup, search)
                        }
                        error={errors.groupId?.message}
                        disabled={isReadOnly}
                        onQuickAdd={(name, onCreated) =>
                          createGroup(name, {
                            onSuccess: (group) => {
                              field.onChange(group.id);
                              onCreated(group);
                            },
                          })
                        }
                      />
                    )}
                  />

                  <Controller
                    name="genericId"
                    control={control}
                    render={({ field }) => (
                      <AsyncSelect
                        label="Generic *"
                        placeholder="Select generic"
                        value={field.value ?? null}
                        selectedLabel={initialData?.generic?.name}
                        onChange={(id) => field.onChange(id)}
                        useOptions={(search) =>
                          useLookupsOptions(LookupType.Generic, search)
                        }
                        error={errors.genericId?.message}
                        disabled={isReadOnly}
                        onQuickAdd={(name, onCreated) =>
                          createGeneric(name, {
                            onSuccess: (generic) => {
                              field.onChange(generic.id);
                              onCreated(generic);
                            },
                          })
                        }
                      />
                    )}
                  />
                </div>

                <Controller
                  name="distributorId"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Distributor"
                      placeholder="Search distributor"
                      value={field.value ?? null}
                      selectedLabel={initialData?.distributor?.name}
                      onChange={(id) => field.onChange(id)}
                      useOptions={useDistributorsOptions}
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
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  type="number"
                  label="Shelf No."
                  min={1}
                  step={1}
                  error={errors.shelfNo?.message}
                  {...register("shelfNo")}
                />

                <Checkbox label="NIV Formulary" {...register("nivFormulary")} />
                <Checkbox label="Active" {...register("isActive")} />
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
