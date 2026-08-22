"use client";

import { forwardRef, useRef, useState, useImperativeHandle } from "react";
import { itemSchema, StockVoucherItemValues } from "@/schemas/stock-voucher";
import { AsyncSelect } from "@/components/ui/async-select";
import { useProductsOptions } from "@/hooks/useProducts";
import { calculateItemAmounts } from "@/lib/stock-calculations";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface EntryRowState {
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: string;
  freeQuantity: string;
  purchaseRate: string;
  saleRate: string;
  discountPercent: string;
  taxPercent: string;
}

const blankEntry: EntryRowState = {
  productId: "",
  productName: "",
  batchNumber: "",
  expiryDate: "",
  quantity: "",
  freeQuantity: "",
  purchaseRate: "",
  saleRate: "",
  discountPercent: "",
  taxPercent: "",
};

interface Props {
  showAdvanced: boolean;
  onAdd: (item: StockVoucherItemValues, productName: string) => void;
  onProductPicked?: (productId: string) => void;
}

export interface StockVoucherEntryRowRef {
  commit: () => void;
  setData: (data: StockVoucherItemValues, productName?: string) => void;
}

export const StockVoucherEntryRow = forwardRef<StockVoucherEntryRowRef, Props>(
  ({ showAdvanced, onAdd, onProductPicked }, ref) => {
    const [entry, setEntry] = useState<EntryRowState>(blankEntry);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const containerRef = useRef<HTMLTableRowElement>(null);

    function set<K extends keyof EntryRowState>(
      key: K,
      value: EntryRowState[K],
    ) {
      setEntry((prev) => ({ ...prev, [key]: value }));
    }

    // Calculate amounts for the entry row preview
    const amounts = calculateItemAmounts({
      quantity: Number(entry.quantity) || 0,
      purchaseRate: Number(entry.purchaseRate) || 0,
      discountPercent: Number(entry.discountPercent) || 0,
      taxPercent: Number(entry.taxPercent) || 0,
    });

    const commit = () => {
      const result = itemSchema.safeParse({
        ...entry,
        expiryDate: entry.expiryDate || undefined,
      });

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0] as string;
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }

      setErrors({});
      onAdd(result.data, entry.productName);
      setEntry(blankEntry);
      requestAnimationFrame(() => {
        containerRef.current?.querySelector<HTMLElement>("input")?.focus();
      });
    };

    useImperativeHandle(ref, () => ({
      commit,
      setData: (data: StockVoucherItemValues, productName?: string) => {
        setEntry({
          productId: data.productId || "",
          productName: productName ?? "",
          batchNumber: data.batchNumber || "",
          expiryDate: data.expiryDate || "",
          quantity: String(data.quantity ?? ""),
          freeQuantity: String(data.freeQuantity ?? "0"),
          purchaseRate: String(data.purchaseRate ?? ""),
          saleRate: String(data.saleRate ?? ""),
          discountPercent: String(data.discountPercent ?? "0"),
          taxPercent: String(data.taxPercent ?? "0"),
        });
        // Clear any previous errors
        setErrors({});
      },
    }));

    function handleKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const inputs = Array.from(
        container.querySelectorAll<HTMLElement>("input"),
      );
      const currentIndex = inputs.indexOf(
        document.activeElement as HTMLElement,
      );

      if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      } else {
        commit();
      }
    }

    // Handle focus on expiry date input to show calendar
    const handleExpiryFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Use showPicker if available (modern browsers)
      if (e.target.showPicker) {
        e.target.showPicker();
      }
    };

    return (
      <tr
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="bg-blue-50/60 border-b-2 border-blue-200"
      >
        <td className="px-3 py-1.5">
          <div className="min-h-[60px] flex flex-col justify-center">
            <AsyncSelect
              placeholder="Scan barcode, medicine, generic..."
              value={entry.productId || null}
              selectedLabel={entry.productName}
              useOptions={useProductsOptions}
              onChange={(id, option) => {
                set("productId", id ?? "");
                set("productName", option?.name ?? "");
                onProductPicked?.(id ?? "");
              }}
              error={errors.productId}
              minChars={2}
            />
          </div>
        </td>
        <td className="px-3 py-1.5">
          <div className="min-h-[60px] flex flex-col justify-center">
            <input
              value={entry.batchNumber}
              onChange={(e) => set("batchNumber", e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              placeholder="Batch #"
            />
            {errors.batchNumber && (
              <div className="text-xs text-red-600 mt-0.5 leading-none">
                {errors.batchNumber}
              </div>
            )}
          </div>
        </td>
        <td className="px-3 py-1.5">
          <div className="min-h-[60px] flex flex-col justify-center">
            <DatePicker
              selected={
                entry.expiryDate ? new Date(entry.expiryDate + "-01") : null
              }
              // Append "-01" to create a valid date from "YYYY-MM"
              onChange={(date: Date | null) => {
                if (date) {
                  // Format as "YYYY-MM" (e.g., "2026-07")
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  set("expiryDate", `${year}-${month}`);
                } else {
                  set("expiryDate", "");
                }
              }}
              dateFormat="MM/yyyy" // Display as "MM/YYYY"
              showMonthYearPicker
              className="w-full border rounded px-2 py-1.5 text-sm bg-white cursor-pointer"
              placeholderText="Select expiry"
              onFocus={handleExpiryFocus}
            />
          </div>
        </td>
        <td className="px-3 py-1.5">
          <div className="min-h-[60px] flex flex-col justify-center">
            <input
              type="number"
              value={entry.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              placeholder="0"
            />
            {errors.quantity && (
              <div className="text-xs text-red-600 mt-0.5 leading-none">
                {errors.quantity}
              </div>
            )}
          </div>
        </td>
        <td className="px-3 py-1.5">
          <div className="min-h-[60px] flex flex-col justify-center">
            <input
              type="number"
              step="0.01"
              value={entry.purchaseRate}
              onChange={(e) => set("purchaseRate", e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              placeholder="0.00"
            />
            {errors.purchaseRate && (
              <div className="text-xs text-red-600 mt-0.5 leading-none">
                {errors.purchaseRate}
              </div>
            )}
          </div>
        </td>
        <td className="px-3 py-1.5">
          <div className="min-h-[60px] flex flex-col justify-center">
            <input
              type="number"
              step="0.01"
              value={entry.saleRate}
              onChange={(e) => set("saleRate", e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              placeholder="0.00"
            />
            {errors.saleRate && (
              <div className="text-xs text-red-600 mt-0.5 leading-none">
                {errors.saleRate}
              </div>
            )}
          </div>
        </td>

        {showAdvanced && (
          <>
            <td className="px-3 py-1.5">
              <div className="min-h-[60px] flex flex-col justify-center">
                <input
                  type="number"
                  value={entry.freeQuantity}
                  onChange={(e) => set("freeQuantity", e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                  placeholder="0"
                />
              </div>
            </td>
            <td className="px-3 py-1.5">
              <div className="min-h-[60px] flex flex-col justify-center">
                <input
                  type="number"
                  step="0.01"
                  value={entry.discountPercent}
                  onChange={(e) => set("discountPercent", e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                  placeholder="0"
                />
              </div>
            </td>
            <td className="px-3 py-1.5">
              <div className="min-h-[60px] flex flex-col justify-center">
                <input
                  type="number"
                  step="0.01"
                  value={entry.taxPercent}
                  onChange={(e) => set("taxPercent", e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                  placeholder="0"
                />
              </div>
            </td>
            <td className="px-3 py-1.5 text-right font-medium text-sm text-gray-600">
              <div className="min-h-[60px] flex items-center justify-end">
                {amounts.grossAmount.toFixed(2)}
              </div>
            </td>
            <td className="px-3 py-1.5 text-right font-medium text-sm text-gray-600">
              <div className="min-h-[60px] flex items-center justify-end">
                {amounts.discountAmount.toFixed(2)}
              </div>
            </td>
            <td className="px-3 py-1.5 text-right font-medium text-sm text-gray-600">
              <div className="min-h-[60px] flex items-center justify-end">
                {amounts.taxAmount.toFixed(2)}
              </div>
            </td>
          </>
        )}

        <td className="px-3 py-1.5 text-right font-medium text-sm text-blue-700">
          <div className="min-h-[60px] flex items-center justify-end">
            {amounts.netAmount.toFixed(2)}
          </div>
        </td>
        <td className="px-3 py-1.5">
          {/* Empty cell - aligns with the actions column where remove button sits */}
        </td>
      </tr>
    );
  },
);

StockVoucherEntryRow.displayName = "StockVoucherEntryRow";
