"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { StockVoucherType } from "@repo/shared";
import {
  stockVoucherFormSchema,
  StockVoucherFormInput,
  StockVoucherFormOutput,
  StockVoucherItemValues,
} from "@/schemas/stock-voucher";
import Link from "next/link";
import {
  VOUCHER_TYPE_LABELS,
  IMPLEMENTED_VOUCHER_TYPES,
} from "@/constants/stock/stock-voucher";
import { buildCreateVoucherPayload } from "./build-payload";
import { getColumns } from "../../../constants/stock/table-columns";
import {
  StockVoucherEntryRow,
  StockVoucherEntryRowRef,
} from "../../../components/features/stock/stockEntry/StockVoucherEntryRow";
import { StockVoucherItemRow } from "../../../components/features/stock/stockEntry/StockVoucherItemRow";
import { useCreateStockVoucher } from "@/hooks/useStock";
import { useProducts } from "@/hooks/useProducts";
import { DistributorSelect } from "@/components/DistributorSelect";
import { calculateItemAmounts } from "@/lib/stock-calculations";
import {
  Save,
  Trash2,
  Eye,
  Printer,
  AlertCircle,
  SlidersHorizontal,
  Plus,
  ArrowLeft,
} from "lucide-react";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";

export default function NewStockVoucherPage() {
  const router = useRouter();
  const createVoucher = useCreateStockVoucher();
  const { data: productsResponse } = useProducts();

  const products = productsResponse?.data ?? [];

  // Build a map of productId -> productName for display in the item rows
  const productMap = Object.fromEntries(
    (products ?? []).map((p) => [p.id, p.name]),
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StockVoucherFormInput, unknown, StockVoucherFormOutput>({
    resolver: zodResolver(stockVoucherFormSchema),
    defaultValues: {
      type: StockVoucherType.PURCHASE,
      distributorId: "",
      voucherDate: new Date().toISOString().slice(0, 10),
      remarks: "",
      items: [],
    },
  });

  const { fields, insert, remove } = useFieldArray({ control, name: "items" });
  const type = useWatch({ control, name: "type" });
  const items = useWatch({ control, name: "items" });
  const distributorId = useWatch({ control, name: "distributorId" });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const columns = getColumns(showAdvanced);

  // Ref to the entry row for programmatic actions
  const entryRowRef = useRef<StockVoucherEntryRowRef>(null);

  // --- Auto-fill distributor from the product currently being entered,
  // falling back to the most recently committed item's product -----------
  const [distributorTouched, setDistributorTouched] = useState(false);
  const [entryProductId, setEntryProductId] = useState("");
  const effectiveProductId = entryProductId || items?.[0]?.productId;

  useEffect(() => {
    if (distributorTouched) return;
    if (!effectiveProductId || !products) return;
    const product = products.find((p) => p.id === effectiveProductId);
    if (product?.defaultDistributorId) {
      setValue("distributorId", product.defaultDistributorId, {
        shouldValidate: true,
      });
    }
  }, [effectiveProductId, products, setValue, distributorTouched]);

  function handleAddItem(item: StockVoucherItemValues) {
    insert(0, item);
  }

  // Called when the user clicks "Edit" on an existing item row.
  // It removes the item from the list (already done by the row itself)
  // and populates the entry row with the item's data for editing.
  function handleEditItem(item: StockVoucherItemValues) {
    entryRowRef.current?.setData(item);
  }

  const totals = items.reduce(
    (acc, item) => {
      const a = calculateItemAmounts({
        quantity: Number(item?.quantity) || 0,
        purchaseRate: Number(item?.purchaseRate) || 0,
        discountPercent: Number(item?.discountPercent) || 0,
        taxPercent: Number(item?.taxPercent) || 0,
      });
      acc.gross += a.grossAmount;
      acc.discount += a.discountAmount;
      acc.tax += a.taxAmount;
      acc.net += a.netAmount;
      return acc;
    },
    { gross: 0, discount: 0, tax: 0, net: 0 },
  );

  const onSubmit = async (data: StockVoucherFormOutput) => {
    const confirmedBatchKeys = new Set<string>(); // batches the user has approved this submit attempt

    const trySubmit = async (): Promise<void> => {
      const payload = buildCreateVoucherPayload(data, confirmedBatchKeys);
      try {
        await createVoucher.mutateAsync(payload);
        router.push("/stock");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const responseData = error?.response?.data;

        // only handle the specific rate-mismatch case — everything else bubbles up as before
        if (responseData?.code === "BATCH_RATE_MISMATCH") {
          const confirmed = window.confirm(
            `Batch ${responseData.batchNumber} already exists at ` +
              `purchase rate ${responseData.existingPurchaseRate} / sale rate ${responseData.existingSaleRate}.\n\n` +
              `Update the batch to the new rate you entered?`,
          );

          if (confirmed) {
            const batchKey = `${responseData.productId}::${responseData.batchNumber}`;
            confirmedBatchKeys.add(batchKey);
            await trySubmit();
            return;
          }
        }

        throw error;
      }
    };

    await trySubmit();
  };

  const handleAddButtonClick = () => {
    if (entryRowRef.current) {
      entryRowRef.current.commit();
    }
  };

  // Create options for voucher type select
  const voucherTypeOptions = Object.entries(VOUCHER_TYPE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    }),
  );

  return (
    <div className="flex flex-col min-h-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col flex-1 gap-4"
      >
        {/* Slim header bar */}
        <Link
          href="/stock"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vouchers
        </Link>

        <Card className="flex flex-wrap items-center gap-4">
          <div className="min-w-[150px]">
            <Select
              label="Type"
              options={voucherTypeOptions}
              {...register("type")}
              error={errors.type?.message}
            />
            {!IMPLEMENTED_VOUCHER_TYPES.has(type) && (
              <div className="flex items-center gap-1 mt-1 text-amber-600">
                <AlertCircle className="w-3 h-3" />
                <p className="text-xs">Not implemented yet</p>
              </div>
            )}
          </div>

          <div className="min-w-[200px] flex-1 relative">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Distributor{" "}
              {type === StockVoucherType.PURCHASE && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <DistributorSelect
              value={distributorId || ""}
              onChange={(id) => {
                setDistributorTouched(true);
                setValue("distributorId", id, { shouldValidate: true });
              }}
            />
            {effectiveProductId && !distributorTouched && distributorId && (
              <p className="text-xs text-gray-400 mt-0.5 absolute top-full left-0">
                Auto-selected from product default
              </p>
            )}
            {errors.distributorId && (
              <p className="text-xs text-red-600 mt-0.5">
                {errors.distributorId.message}
              </p>
            )}
          </div>

          <div className="min-w-[160px]">
            <Input
              type="date"
              label="Date"
              {...register("voucherDate")}
              error={errors.voucherDate?.message}
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <Input
              {...register("remarks")}
              label="Remarks"
              placeholder="Optional"
              error={errors.remarks?.message}
            />
          </div>
        </Card>

        {/* Items table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 min-h-[400px]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {showAdvanced ? "Hide" : "Show"} discount &amp; tax fields
              </button>
            </div>
            <Button onClick={handleAddButtonClick}>
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                {columns.map((col) => (
                  <col key={col.key} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                        ["product", "batch", "expiry"].includes(col.key)
                          ? "text-left"
                          : col.key === "actions"
                            ? "text-center"
                            : "text-right"
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <StockVoucherEntryRow
                  ref={entryRowRef}
                  showAdvanced={showAdvanced}
                  onAdd={handleAddItem}
                  onProductPicked={setEntryProductId}
                />
                {fields.map((field, index) => (
                  <StockVoucherItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    register={register}
                    onRemove={() => remove(index)}
                    onEdit={handleEditItem}
                    itemErrors={errors.items?.[index]}
                    showAdvanced={showAdvanced}
                    products={productMap}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {errors.items?.message && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200 shrink-0">
              <p className="text-xs text-red-600">{errors.items.message}</p>
            </div>
          )}
        </div>

        {/* Secondary actions (not yet wired) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 font-medium rounded-lg cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 font-medium rounded-lg cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 font-medium rounded-lg cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        <div className="h-20 shrink-0" aria-hidden />
      </form>

      <div className="sticky bottom-0 bg-gray-100 rounded-lg shadow-xl border border-gray-400 ">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-500">
              Gross{" "}
              <span className="text-gray-900 font-medium">
                {totals.gross.toFixed(2)}
              </span>
            </span>
            <span className="text-gray-500">
              Disc{" "}
              <span className="text-green-600 font-medium">
                -{totals.discount.toFixed(2)}
              </span>
            </span>
            <span className="text-gray-500">
              Tax{" "}
              <span className="text-orange-600 font-medium">
                +{totals.tax.toFixed(2)}
              </span>
            </span>
            <span className="text-base font-semibold text-gray-900">
              Net{" "}
              <span className="text-blue-800 text-xl font-bold ml-1">
                {totals.net.toFixed(2)}
              </span>
            </span>
          </div>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Voucher"}
          </Button>
        </div>
      </div>
    </div>
  );
}
