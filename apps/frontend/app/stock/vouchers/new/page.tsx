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
} from "./schema";
import { VOUCHER_TYPE_LABELS, IMPLEMENTED_VOUCHER_TYPES } from "./schema";
import { buildCreateVoucherPayload } from "./build-payload";
import { previewVoucherNumber } from "./voucher-number-preview";
import { getColumns } from "./table-columns";
import {
  StockVoucherEntryRow,
  StockVoucherEntryRowRef,
} from "./StockVoucherEntryRow";
import { StockVoucherItemRow } from "./StockVoucherItemRow";
import { useCreateStockVoucher, useStockVouchers } from "@/hooks/useStock";
import { useProducts } from "@/hooks/useProducts";
import { SupplierSelect } from "@/components/SupplierSelect";
import { calculateItemAmounts } from "@/lib/stock-calculations";
import {
  Save,
  Trash2,
  Eye,
  Printer,
  AlertCircle,
  SlidersHorizontal,
  Plus,
} from "lucide-react";

export default function NewStockVoucherPage() {
  const router = useRouter();
  const createVoucher = useCreateStockVoucher();
  const { data: vouchers } = useStockVouchers();
  const { data: products } = useProducts();

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
      supplierId: "",
      voucherDate: new Date().toISOString().slice(0, 10),
      remarks: "",
      items: [],
    },
  });

  const { fields, insert, remove } = useFieldArray({ control, name: "items" });
  const type = useWatch({ control, name: "type" });
  const items = useWatch({ control, name: "items" });
  const supplierId = useWatch({ control, name: "supplierId" });

  const voucherNoPreview = previewVoucherNumber(type, vouchers);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const columns = getColumns(showAdvanced);

  // Use ref directly without state
  const entryRowRef = useRef<StockVoucherEntryRowRef>(null);

  // --- Auto-fill supplier from the product currently being entered,
  // falling back to the most recently committed item's product -----------
  const [supplierTouched, setSupplierTouched] = useState(false);
  const [entryProductId, setEntryProductId] = useState("");
  const effectiveProductId = entryProductId || items?.[0]?.productId;

  useEffect(() => {
    if (supplierTouched) return;
    if (!effectiveProductId || !products) return;
    const product = products.find((p) => p.id === effectiveProductId);
    if (product?.defaultSupplierId) {
      setValue("supplierId", product.defaultSupplierId, {
        shouldValidate: true,
      });
    }
  }, [effectiveProductId, products, setValue, supplierTouched]);

  function handleAddItem(item: StockVoucherItemValues) {
    insert(0, item);
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
    const payload = buildCreateVoucherPayload(data);
    await createVoucher.mutateAsync(payload);
    router.push("/stock/vouchers");
  };

  const handleAddButtonClick = () => {
    if (entryRowRef.current) {
      entryRowRef.current.commit();
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col flex-1 gap-4"
      >
        {/* Slim header bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap items-end gap-4 shrink-0">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Type
            </label>
            <select
              {...register("type")}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium"
            >
              {Object.entries(VOUCHER_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {!IMPLEMENTED_VOUCHER_TYPES.has(type) && (
              <div className="flex items-center gap-1 mt-1 text-amber-600">
                <AlertCircle className="w-3 h-3" />
                <p className="text-xs">Not implemented yet</p>
              </div>
            )}
          </div>

          <div className="min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Supplier{" "}
              {type === StockVoucherType.PURCHASE && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <SupplierSelect
              value={supplierId || ""}
              onChange={(id) => {
                setSupplierTouched(true);
                setValue("supplierId", id, { shouldValidate: true });
              }}
            />
            {effectiveProductId && !supplierTouched && supplierId && (
              <p className="text-xs text-gray-400 mt-0.5">
                Auto-selected from product default
              </p>
            )}
            {errors.supplierId && (
              <p className="text-xs text-red-600 mt-0.5">
                {errors.supplierId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Date
            </label>
            <input
              type="date"
              {...register("voucherDate")}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Remarks
            </label>
            <input
              {...register("remarks")}
              placeholder="Optional"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>

          <div className="text-sm text-gray-500 whitespace-nowrap">
            {voucherNoPreview}{" "}
            <span className="text-xs text-gray-400">(estimated)</span>
          </div>
        </div>

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
            <button
              type="button"
              onClick={handleAddButtonClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
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
                    itemErrors={errors.items?.[index]}
                    showAdvanced={showAdvanced}
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
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Voucher"}
          </button>
        </div>
      </div>
    </div>
  );
}
