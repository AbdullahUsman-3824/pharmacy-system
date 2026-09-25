"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import Separator from "@/components/ui/separator";
import {
  useSystemSettings,
  useUpdateSystemSettings,
} from "@/hooks/useSystemSettings";

const CURRENCY_OPTIONS = [
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "BDT", label: "BDT — Bangladeshi Taka" },
];

const schema = z.object({
  // Pharmacy info
  pharmacyName: z.string().min(1, "Pharmacy name is required"),
  pharmacyAddress: z.string().optional(),
  pharmacyPhone: z.string().optional(),
  pharmacyEmail: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),

  // Tax
  gstEnabled: z.boolean(),
  gstRate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === "" || val === undefined) return true;
        const n = parseFloat(val);
        return !isNaN(n) && n >= 0 && n <= 100;
      },
      { message: "Rate must be between 0 and 100" },
    ),

  // Currency
  currency: z.string().min(1, "Please select a currency"),
});

type FormValues = z.infer<typeof schema>;

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold tracking-[0.12em] uppercase text-[var(--color-text)]">
        {title}
      </h3>
      {description && (
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
    </div>
  );
}

export function SettingsForm() {
  const { data: settings, isLoading } = useSystemSettings();
  const { mutateAsync, isPending } = useUpdateSystemSettings();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pharmacyName: "",
      pharmacyAddress: "",
      pharmacyPhone: "",
      pharmacyEmail: "",
      gstEnabled: false,
      gstRate: "",
      currency: "PKR",
    },
  });

  const gstEnabled = watch("gstEnabled");

  useEffect(() => {
    if (settings) {
      reset({
        pharmacyName: settings.pharmacyName ?? "",
        pharmacyAddress: settings.pharmacyAddress ?? "",
        pharmacyPhone: settings.pharmacyPhone ?? "",
        pharmacyEmail: settings.pharmacyEmail ?? "",
        gstEnabled: settings.gstEnabled ?? false,
        gstRate: settings.gstRate != null ? String(settings.gstRate) : "",
        currency: settings.currency ?? "PKR",
      });
    }
  }, [settings, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await mutateAsync({
        pharmacyName: values.pharmacyName,
        pharmacyAddress: values.pharmacyAddress || undefined,
        pharmacyPhone: values.pharmacyPhone || undefined,
        pharmacyEmail: values.pharmacyEmail || undefined,
        gstEnabled: values.gstEnabled,
        gstRate:
          values.gstRate !== "" && values.gstRate !== undefined
            ? parseFloat(values.gstRate)
            : undefined,
        currency: values.currency,
      });
      toast.success("Settings saved.");
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card padding="lg" className="space-y-8">
        {/* ── Pharmacy Information ── */}
        <div className="space-y-5">
          <SectionHeader
            title="Pharmacy Information"
            description="Appears on invoices, receipts, and reports."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Pharmacy Name"
                placeholder="e.g. City Medical Store"
                disabled={isLoading}
                error={errors.pharmacyName?.message}
                {...register("pharmacyName")}
              />
            </div>

            <Input
              label="Phone Number"
              placeholder="e.g. +92 300 0000000"
              disabled={isLoading}
              error={errors.pharmacyPhone?.message}
              {...register("pharmacyPhone")}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. info@pharmacy.com"
              disabled={isLoading}
              error={errors.pharmacyEmail?.message}
              {...register("pharmacyEmail")}
            />

            <div className="sm:col-span-2">
              <Textarea
                label="Address"
                placeholder="Street, City, Province"
                rows={3}
                disabled={isLoading}
                error={errors.pharmacyAddress?.message}
                {...register("pharmacyAddress")}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Tax / GST ── */}
        <div className="space-y-5">
          <SectionHeader
            title="Tax / GST"
            description="Configure whether GST is applied to sales and set the applicable rate."
          />

          <div className="space-y-4">
            <Controller
              name="gstEnabled"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <input
                    id="gstEnabled"
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-2 focus:ring-offset-2 transition-colors duration-200"
                  />
                  <label
                    htmlFor="gstEnabled"
                    className="text-sm font-medium text-[var(--color-text-secondary)] select-none cursor-pointer"
                  >
                    Enable GST on sales
                  </label>
                </div>
              )}
            />

            {gstEnabled && (
              <div className="max-w-[200px]">
                <Input
                  label="GST Rate (%)"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="e.g. 17"
                  disabled={isLoading}
                  error={errors.gstRate?.message}
                  {...register("gstRate")}
                />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* ── Currency ── */}
        <div className="space-y-5">
          <SectionHeader
            title="Currency"
            description="Set the display currency used across the system."
          />

          <div className="max-w-xs">
            <Select
              label="Currency"
              options={CURRENCY_OPTIONS}
              disabled={isLoading}
              error={errors.currency?.message}
              {...register("currency")}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end border-t border-[var(--color-border)] pt-5">
          <Button type="submit" disabled={!isDirty || isPending}>
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
