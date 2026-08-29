"use client";

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { Check, X, CircleAlert } from "lucide-react";
import { saleItemSchema, SaleItemValues } from "@/schemas/sale-form";
import { useProductStock } from "@/hooks/useStock";
import { AsyncSelect } from "@/components/ui/async-select";
import { useSaleProductOptions } from "@/hooks/useSale";

interface EntryRowState {
  productId: string;
  productName: string;
  productDisplayName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  packQuantity: string;
  looseQuantity: string;
  saleRate: string; // unit rate
}

const blankEntry: EntryRowState = {
  productId: "",
  productName: "",
  productDisplayName: "",
  batchId: "",
  batchNumber: "",
  expiryDate: "",
  packQuantity: "",
  looseQuantity: "",
  saleRate: "",
};

interface Props {
  onAdd: (item: SaleItemValues) => void;
  existingItems?: SaleItemValues[];
}

export interface SaleEntryRowRef {
  commit: () => void;
  focus: () => void;
}

function formatExpiry(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Invalid";
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

type ExpiryStatus = "expired" | "near" | "safe";

function getExpiryStatus(dateStr?: string): ExpiryStatus {
  if (!dateStr) return "safe";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "safe";
  const daysLeft = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 90) return "near";
  return "safe";
}

const expiryColorClass: Record<ExpiryStatus, string> = {
  expired: "text-red-600 font-medium",
  near: "text-orange-600 font-medium",
  safe: "text-gray-700",
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export const SaleEntryRow = forwardRef<SaleEntryRowRef, Props>(
  ({ onAdd, existingItems = [] }, ref) => {
    const [entry, setEntry] = useState<EntryRowState>(blankEntry);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [flash, setFlash] = useState(false);
    const containerRef = useRef<HTMLTableRowElement>(null);
    const packQtyRef = useRef<HTMLInputElement>(null);

    const { data: stock } = useProductStock(entry.productId);

    const batches = useMemo(() => stock?.batches ?? [], [stock?.batches]);

    const selectedBatch = useMemo(
      () => batches.find((b) => b.batchId === entry.batchId),
      [batches, entry.batchId],
    );

    const packingSize = selectedBatch?.packingSize ?? 1;

    /** Units already reserved in the cart for this batch */
    function usedUnitsForBatch(batchId: string) {
      return existingItems
        .filter((i) => i.batchId === batchId)
        .reduce((sum, i) => {
          const ps = Number(i.packingSize) || packingSize || 1;
          return (
            sum +
            Number(i.packQuantity || 0) * ps +
            Number(i.looseQuantity || 0)
          );
        }, 0);
    }

    /** currentQuantity is in UNITS — split into packs + loose */
    function expectedStockFor(batch: (typeof batches)[number]) {
      const ps = batch.packingSize || 1;
      const remainingUnits = Math.max(
        0,
        batch.currentQuantity - usedUnitsForBatch(batch.batchId),
      );
      return {
        packs: Math.floor(remainingUnits / ps),
        loose: remainingUnits % ps,
        totalUnits: remainingUnits,
      };
    }

    const selectedExpected = selectedBatch
      ? expectedStockFor(selectedBatch)
      : null;

    // Auto-select FEFO batch when product is chosen
    useEffect(() => {
      if (!entry.productId || batches.length === 0) return;
      if (entry.batchId) return;
      const first = batches[0];
      setEntry((prev) => ({
        ...prev,
        batchId: first.batchId,
        batchNumber: first.batchNumber,
        expiryDate: first.expiryDate ?? "",
      }));
    }, [entry.productId, batches, entry.batchId]);

    // Batch.saleRate is pack rate (from stock entry) → convert to UNIT rate
    // batch.saleRate is already unit rate
    useEffect(() => {
      if (!selectedBatch) return;
      setEntry((prev) => ({
        ...prev,
        saleRate: Number(selectedBatch.saleRate).toFixed(2),
      }));
    }, [selectedBatch]);

    function set<K extends keyof EntryRowState>(
      key: K,
      value: EntryRowState[K],
    ) {
      setEntry((prev) => ({ ...prev, [key]: value }));
    }

    function handleProductChange(productId: string, option?: { name: string }) {
      setEntry({
        ...blankEntry,
        productId,
        productName: option?.name ?? "",
        productDisplayName: option?.name ?? "",
      });
      setErrors({});
      requestAnimationFrame(() => packQtyRef.current?.focus());
    }

    function handleBatchChange(batchId: string) {
      const batch = batches.find((b) => b.batchId === batchId);
      if (!batch) return;
      setEntry((prev) => ({
        ...prev,
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate ?? "",
      }));
      setErrors((prev) => ({ ...prev, packQuantity: "", looseQuantity: "" }));
    }

    function validateQuantities(packQty: number, looseQty: number) {
      const nextErrors: Record<string, string> = {};
      if (selectedBatch) {
        const remainingUnits = Math.max(
          0,
          selectedBatch.currentQuantity -
            usedUnitsForBatch(selectedBatch.batchId),
        );
        const requestedUnits = packQty * packingSize + looseQty;

        if (requestedUnits > remainingUnits) {
          const maxPacks = Math.floor(remainingUnits / packingSize);
          const maxLoose = remainingUnits % packingSize;
          if (packQty > maxPacks) {
            nextErrors.packQuantity = `Only ${maxPacks} packs available`;
          } else if (looseQty > 0) {
            nextErrors.looseQuantity = `Only ${remainingUnits} units available (${maxPacks}p + ${maxLoose}u)`;
          } else {
            nextErrors.packQuantity = `Only ${remainingUnits} units available`;
          }
        }
      }
      setErrors((prev) => ({
        ...prev,
        packQuantity: nextErrors.packQuantity ?? "",
        looseQuantity: nextErrors.looseQuantity ?? "",
      }));
      return nextErrors;
    }

    function handlePackQtyChange(value: string) {
      set("packQuantity", value);
      validateQuantities(Number(value) || 0, Number(entry.looseQuantity) || 0);
    }

    function handleLooseQtyChange(value: string) {
      set("looseQuantity", value);
      validateQuantities(Number(entry.packQuantity) || 0, Number(value) || 0);
    }

    function resetRow() {
      setEntry(blankEntry);
      setErrors({});
    }

    const packQtyNum = Number(entry.packQuantity) || 0;
    const looseQtyNum = Number(entry.looseQuantity) || 0;
    const unitRate = Number(entry.saleRate) || 0;
    const unitQuantity = packQtyNum * packingSize + looseQtyNum;
    const netAmount = round2(unitQuantity * unitRate);

    const commit = () => {
      const packQty = Math.trunc(Number(entry.packQuantity) || 0);
      const looseQty = Math.trunc(Number(entry.looseQuantity) || 0);

      if (selectedBatch) {
        const stockErrors = validateQuantities(packQty, looseQty);
        if (stockErrors.packQuantity || stockErrors.looseQuantity) return;
      }

      const saleRate = Number(entry.saleRate) || 0;

      const result = saleItemSchema.safeParse({
        productId: entry.productId,
        productName: entry.productName,
        batchId: entry.batchId,
        batchNumber: entry.batchNumber,
        expiryDate: entry.expiryDate || undefined,
        packingSize,
        packQuantity: packQty,
        looseQuantity: looseQty,
        saleRate,
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
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
      requestAnimationFrame(() => {
        containerRef.current?.querySelector<HTMLElement>("input")?.focus();
      });
    };

    const focus = () => {
      containerRef.current
        ?.querySelector<HTMLElement>('[data-nav="true"]')
        ?.focus();
    };
    useImperativeHandle(ref, () => ({ commit, focus }));
    useEffect(() => {
      focus();
    }, []);

    function handleKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const inputs = Array.from(
        container.querySelectorAll<HTMLElement>('[data-nav="true"]'),
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

    function ErrorIcon({ message }: { message: string }) {
      return (
        <span
          title={message}
          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-600 text-[10px] font-bold cursor-help shrink-0"
        >
          <CircleAlert />
        </span>
      );
    }

    const expiryStatus = getExpiryStatus(entry.expiryDate);
    const isProductSelected = !!entry.productId;
    const isBatchSelected = !!entry.batchId;

    const showInfo = isProductSelected && isBatchSelected && selectedExpected;
    const showNoStock =
      isProductSelected && !isBatchSelected && batches.length === 0;

    const containerBaseClass = "transition-colors duration-300 relative";
    const innerBorderClass = flash
      ? "shadow-[inset_4px_0_0_0_#4ade80]"
      : "shadow-[inset_4px_0_0_0_#60a5fa]";
    const flashClass = flash
      ? "bg-green-50/70"
      : "bg-blue-50/30 hover:bg-blue-50/50";
    const mainRowBottomBorder =
      showInfo || showNoStock ? "" : "border-b border-gray-200";
    const mainRowClasses = `${containerBaseClass} ${innerBorderClass} ${flashClass} ${mainRowBottomBorder}`;
    // const infoRowClasses = `${containerBaseClass} ${innerBorderClass} ${flashClass} border-b border-gray-200`;

    return (
      <>
        <tr
          ref={containerRef}
          onKeyDown={handleKeyDown}
          className={mainRowClasses}
        >
          {/* Product */}
          <td className="px-3 py-2">
            <div className="flex items-center gap-1 product-select">
              <AsyncSelect
                placeholder="Search product..."
                value={entry.productId || null}
                selectedLabel={entry.productDisplayName}
                onChange={(id, option) => handleProductChange(id ?? "", option)}
                useOptions={useSaleProductOptions}
                renderOption={(option) => (
                  <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
                    <span className="truncate">{option.name}</span>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {option.currentQuantity != null
                        ? `${option.currentQuantity} units`
                        : "—"}
                    </span>
                  </div>
                )}
                minChars={2}
                triggerClassName="h-9 py-0 px-3 rounded-md text-sm"
              />
              {errors.productId && <ErrorIcon message={errors.productId} />}
            </div>
          </td>

          {/* Batch + Stock */}
          <td className="px-3 py-2 align-middle">
            <div className="relative flex flex-col">
              <select
                value={entry.batchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                disabled={!isProductSelected || batches.length === 0}
                className="h-8 w-full min-w-[100px] rounded-md border border-gray-300 px-2 text-sm bg-white disabled:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {batches.length === 0 && <option value="">No stock</option>}
                {batches.map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batchNumber}
                  </option>
                ))}
              </select>
              {selectedBatch && stock && (
                <div className="absolute -bottom-5 left-0 text-[11px] text-gray-500 mt-0.5 whitespace-nowrap">
                  {Math.max(
                    0,
                    selectedBatch.currentQuantity -
                      usedUnitsForBatch(selectedBatch.batchId),
                  )}{" "}
                  / {stock.totalQuantity}
                </div>
              )}
            </div>
          </td>

          {/* Expiry */}
          <td className="px-3 py-2 align-middle">
            <div className={expiryColorClass[expiryStatus]}>
              {formatExpiry(entry.expiryDate)}
            </div>
          </td>

          {/* Pack + Loose Qty */}
          <td className="px-3 py-2 align-middle">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 w-8 shrink-0">
                  Pack
                </span>
                <input
                  ref={packQtyRef}
                  type="number"
                  value={entry.packQuantity}
                  onChange={(e) => handlePackQtyChange(e.target.value)}
                  className={`h-7 w-16 rounded-md border px-2 py-1 text-sm bg-white text-center font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.packQuantity
                      ? "border-red-400 ring-2 ring-red-400"
                      : "border-gray-300"
                  }`}
                  placeholder="0"
                  data-nav="true"
                  title={errors.packQuantity || ""}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 w-8 shrink-0">
                  Unit
                </span>
                <input
                  type="number"
                  value={entry.looseQuantity}
                  onChange={(e) => handleLooseQtyChange(e.target.value)}
                  disabled={!selectedBatch || packingSize <= 1}
                  className={`h-7 w-16 rounded-md border px-2 py-1 text-sm bg-white text-center text-gray-600 disabled:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.looseQuantity
                      ? "border-red-400 ring-2 ring-red-400"
                      : "border-gray-300"
                  }`}
                  placeholder="0"
                  data-nav="true"
                  title={errors.looseQuantity || ""}
                />
              </div>
            </div>
          </td>

          {/* Rate — unit only */}
          <td className="px-3 py-2 align-middle">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-gray-700">
                {entry.saleRate ? Number(entry.saleRate).toFixed(2) : "0.00"}
              </span>
              <span className="text-[10px] text-gray-400">Per Unit</span>
            </div>
          </td>

          {/* Amount */}
          <td className="px-3 py-2 align-middle text-right">
            <span className="text-sm font-bold text-blue-700">
              {netAmount.toFixed(2)}
            </span>
          </td>

          {/* Action */}
          <td className="px-3 py-2 text-center align-middle">
            <div className="flex flex-col items-center gap-1.5">
              {/* Primary — Add / Enter */}
              <button
                type="button"
                onClick={commit}
                title="Add item (Enter)"
                className="inline-flex items-center justify-center h-6 w-6 rounded-sm bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-[var(--transition-fast)]"
              >
                <Check className="w-4 h-4" />
              </button>

              {/* Secondary — Clear */}
              <button
                type="button"
                onClick={resetRow}
                title="Clear"
                className="inline-flex items-center justify-center h-5 w-5 rounded text-[var(--color-text-disabled)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] focus:outline-none transition-[var(--transition-fast)]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </td>
        </tr>

        {/* {showInfo && (
          <tr className={infoRowClasses}>
            <td colSpan={7} className="px-4 py-2">
              <div className="flex items-center flex-wrap gap-3 text-xs">
                {batches.length > 1 && (
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-200/60">
                    <Check className="w-3.5 h-3.5" />
                    <span className="font-medium">FEFO batch selected</span>
                  </div>
                )}

                <div
                  className={`flex items-center gap-2 ${
                    selectedExpected.totalUnits <= 5
                      ? "text-red-600"
                      : selectedExpected.totalUnits <= 15
                        ? "text-amber-600"
                        : "text-green-600"
                  }`}
                >
                  <span className="font-medium">Remaining Stock:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium">
                      {selectedExpected.packs} Packs
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium">
                      {selectedExpected.loose} Units
                    </span>
                  </div>
                </div>

                {selectedExpected.totalUnits === 0 && (
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Out of Stock
                  </span>
                )}
              </div>
            </td>
          </tr>
        )} */}

        {/* {showNoStock && (
          <tr className={infoRowClasses}>
            <td colSpan={7} className="px-4 py-2">
              <div className="flex items-center gap-1.5 text-red-600 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                Out of stock — no batches available for this product
              </div>
            </td>
          </tr>
        )} */}
      </>
    );
  },
);

SaleEntryRow.displayName = "SaleEntryRow";
