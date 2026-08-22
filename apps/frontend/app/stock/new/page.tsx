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
import { useDistributorsOptions } from "@/hooks/useDistributors";
import { calculateItemAmounts } from "@/lib/stock-calculations";
import { AsyncSelect } from "@/components/ui/async-select";
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
      payments: [], // dummy — will be wired later
      items: [],
    },
  });

  const { fields, insert, remove } = useFieldArray({ control, name: "items" });
  const type = useWatch({ control, name: "type" });
  const items = useWatch({ control, name: "items" });
  const supplierId = useWatch({ control, name: "supplierId" });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const columns = getColumns(showAdvanced);

  // Ref to the entry row for programmatic actions
  const entryRowRef = useRef<StockVoucherEntryRowRef>(null);

  // --- Auto-fill distributor from the product currently being entered,
  // falling back to the most recently committed item's product -----------
  const [distributorTouched, setDistributorTouched] = useState(false);
  const [entryProductId, setEntryProductId] = useState("");
  const effectiveProductId = entryProductId || items?.[0]?.productId;

  // productId -> name map, populated as items are added
  const [productNames, setProductNames] = useState<Record<string, string>>({});

  // Track the label of the currently selected distributor for AsyncSelect
  const [distributorLabel, setDistributorLabel] = useState<string>("");

  // NOTE: auto-fill from product's distributorId is removed because we no
  // longer eagerly fetch all products. It can be re-added when a
  // useProduct(id) lookup is threaded through StockVoucherEntryRow.

  function handleAddItem(item: StockVoucherItemValues, productName: string) {
    insert(0, item);
    if (productName) {
      setProductNames((prev) => ({ ...prev, [item.productId]: productName }));
    }
  }

  function handleEditItem(item: StockVoucherItemValues) {
    entryRowRef.current?.setData(item, productNames[item.productId]);
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
    const confirmedBatchKeys = new Set<string>();

    const trySubmit = async (): Promise<void> => {
      const payload = buildCreateVoucherPayload(data, confirmedBatchKeys);
      try {
        await createVoucher.mutateAsync(payload);
        router.push("/stock");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const responseData = error?.response?.data;

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
    entryRowRef.current?.commit();
  };

  const voucherTypeOptions = Object.entries(VOUCHER_TYPE_LABELS).map(
    ([value, label]) => ({ value, label }),
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
            <AsyncSelect
              label={
                type === StockVoucherType.PURCHASE
                  ? "Distributor *"
                  : "Distributor"
              }
              placeholder="Search distributor..."
              value={supplierId ?? null}
              selectedLabel={distributorLabel}
              useOptions={useDistributorsOptions}
              onChange={(id, option) => {
                setDistributorTouched(true);
                setValue("supplierId", id ?? "", { shouldValidate: true });
                setDistributorLabel(option?.name ?? "");
              }}
              error={errors.supplierId?.message}
            />
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
                    products={productNames}
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

      <div className="sticky bottom-0 bg-gray-100 rounded-lg shadow-xl border border-gray-400">
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
