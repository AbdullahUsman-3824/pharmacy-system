"use client";

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
} from "react";
import { saleItemSchema, SaleItemValues } from "@/schemas/sale-form";
import { ProductSelect } from "@/components/ProductSelect";
import { useProductStock } from "@/hooks/useStock";
import { calculateSaleItemAmounts } from "@/lib/sale-calculations";

interface EntryRowState {
  productId: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: string;
  saleRate: string;
  discountPercent: string;
  taxPercent: string;
}

const blankEntry: EntryRowState = {
  productId: "",
  batchId: "",
  batchNumber: "",
  expiryDate: "",
  quantity: "",
  saleRate: "",
  discountPercent: "0",
  taxPercent: "0",
};

interface Props {
  showAdvanced: boolean;
  onAdd: (item: SaleItemValues) => void;
}

export interface SaleEntryRowRef {
  commit: () => void;
}

export const SaleEntryRow = forwardRef<SaleEntryRowRef, Props>(
  ({ showAdvanced, onAdd }, ref) => {
    const [entry, setEntry] = useState<EntryRowState>(blankEntry);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const containerRef = useRef<HTMLTableRowElement>(null);

    const { data: stock } = useProductStock(entry.productId);
    const batches = stock?.batches ?? [];
    const selectedBatch = batches.find((b) => b.batchId === entry.batchId);

    // When a product is picked, auto-select the FEFO-first batch (batches
    // already come expiry-ordered from the backend) and prefill its saleRate.
    useEffect(() => {
      if (!entry.productId || batches.length === 0) return;
      if (entry.batchId) return; // don't override a batch the cashier already chose

      const first = batches[0];
      setEntry((prev) => ({
        ...prev,
        batchId: first.batchId,
        batchNumber: first.batchNumber,
        expiryDate: first.expiryDate ?? "",
        saleRate: String(first.saleRate),
      }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entry.productId, batches.length]);

    function set<K extends keyof EntryRowState>(
      key: K,
      value: EntryRowState[K],
    ) {
      setEntry((prev) => ({ ...prev, [key]: value }));
    }

    function handleProductChange(productId: string) {
      setEntry({ ...blankEntry, productId });
    }

    function handleBatchChange(batchId: string) {
      const batch = batches.find((b) => b.batchId === batchId);
      if (!batch) return;
      setEntry((prev) => ({
        ...prev,
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate ?? "",
        saleRate: String(batch.saleRate),
      }));
    }

    const amounts = calculateSaleItemAmounts({
      quantity: Number(entry.quantity) || 0,
      saleRate: Number(entry.saleRate) || 0,
      discountPercent: Number(entry.discountPercent) || 0,
      taxPercent: Number(entry.taxPercent) || 0,
    });

    const commit = () => {
      const requestedQty = Number(entry.quantity) || 0;

      if (selectedBatch && requestedQty > selectedBatch.currentQuantity) {
        setErrors({
          quantity: `Only ${selectedBatch.currentQuantity} in stock for this batch`,
        });
        return;
      }

      const result = saleItemSchema.safeParse({
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
      onAdd(result.data);
      setEntry(blankEntry);
      requestAnimationFrame(() => {
        containerRef.current?.querySelector<HTMLElement>("input")?.focus();
      });
    };

    useImperativeHandle(ref, () => ({
      commit,
    }));

    function handleKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const inputs = Array.from(
        container.querySelectorAll<HTMLElement>("input, select"),
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

    return (
      <tr
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="bg-blue-50/60 border-b-2 border-blue-200"
      >
        <td className="px-3 py-1.5">
          <div className="min-h-[60px] flex flex-col justify-center">
            <ProductSelect
              value={entry.productId}
              onChange={handleProductChange}
            />
            {errors.productId && (
              <div className="text-xs text-red-600 mt-0.5 leading-none">
                {errors.productId}
              </div>
            )}
          </div>
        </td>
        <td className="px-3 py-1.5">
          <div className="min-h-[60px] flex flex-col justify-center">
            <select
              value={entry.batchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              disabled={!entry.productId || batches.length === 0}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white disabled:bg-gray-50"
            >
              {batches.length === 0 && <option value="">No stock</option>}
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchNumber} (Qty: {b.currentQuantity})
                </option>
              ))}
            </select>
            {errors.batchId && (
              <div className="text-xs text-red-600 mt-0.5 leading-none">
                {errors.batchId}
              </div>
            )}
          </div>
        </td>
        <td className="px-3 py-1.5">
          <div className="min-h-[60px] flex items-center text-sm text-gray-600">
            {entry.expiryDate
              ? new Date(entry.expiryDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
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
        <td className="px-3 py-1.5" />
      </tr>
    );
  },
);

SaleEntryRow.displayName = "SaleEntryRow";
