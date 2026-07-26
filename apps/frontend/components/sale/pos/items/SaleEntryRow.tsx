"use client";

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
} from "react";
import { X } from "lucide-react";
import { saleItemSchema, SaleItemValues } from "@/schemas/sale-form";
import { ProductSelect } from "@/components/ProductSelect";
import { useProductStock } from "@/hooks/useStock";

interface EntryRowState {
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  packQuantity: string;
  looseQuantity: string;
  saleRate: string; // per pack
  looseRate: string; // per loose unit, derived
}

const blankEntry: EntryRowState = {
  productId: "",
  productName: "",
  batchId: "",
  batchNumber: "",
  expiryDate: "",
  packQuantity: "",
  looseQuantity: "",
  saleRate: "",
  looseRate: "",
};

interface Props {
  onAdd: (item: SaleItemValues) => void;
  // Items already committed to this sale (not yet saved), used to compute
  // expected remaining stock per batch so the cashier can't oversell within
  // the current transaction.
  existingItems?: SaleItemValues[];
}

export interface SaleEntryRowRef {
  commit: () => void;
}

function formatCompactExpiry(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = String(d.getFullYear()).slice(-2);
  return `${month}-${year}`;
}

type ExpiryStatus = "expired" | "near" | "safe";

function getExpiryStatus(dateStr?: string): ExpiryStatus {
  if (!dateStr) return "safe";
  const daysLeft =
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 90) return "near";
  return "safe";
}

// Neutral by default — only near/expired batches get called out in color.
const expiryColorClass: Record<ExpiryStatus, string> = {
  expired: "text-red-600 font-medium",
  near: "text-orange-600 font-medium",
  safe: "text-gray-600",
};

// Tailwind arbitrary variants to hide native number-input spinners on
// read-only rate fields, so they look like plain text, not editable inputs.
const noSpinnerClass =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export const SaleEntryRow = forwardRef<SaleEntryRowRef, Props>(
  ({ onAdd, existingItems = [] }, ref) => {
    const [entry, setEntry] = useState<EntryRowState>(blankEntry);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [flash, setFlash] = useState(false);
    const containerRef = useRef<HTMLTableRowElement>(null);
    const packQtyRef = useRef<HTMLInputElement>(null);

    const { data: stock } = useProductStock(entry.productId);
    const batches = stock?.batches ?? [];
    const selectedBatch = batches.find((b) => b.batchId === entry.batchId);
    const packingSize = selectedBatch?.packingSize ?? 1;

    function usedPacksForBatch(batchId: string) {
      return existingItems
        .filter((i) => i.batchId === batchId)
        .reduce((sum, i) => sum + Number(i.packQuantity || 0), 0);
    }
    function usedLooseForBatch(batchId: string) {
      return existingItems
        .filter((i) => i.batchId === batchId)
        .reduce((sum, i) => sum + Number(i.looseQuantity || 0), 0);
    }

    // Base "expected stock" per batch — already-committed lines in this
    // sale subtracted from backend stock. Shown directly to the cashier and
    // also used inside the batch dropdown per-option.
    function expectedStockFor(batch: (typeof batches)[number]) {
      return {
        packs: batch.currentQuantity - usedPacksForBatch(batch.batchId),
        loose: (batch.looseQuantity ?? 0) - usedLooseForBatch(batch.batchId),
      };
    }

    const selectedExpected = selectedBatch
      ? expectedStockFor(selectedBatch)
      : null;

    // When a product is picked, auto-select the FEFO-first batch.
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entry.productId, batches.length]);

    // Recompute pack/loose rate whenever the batch changes.
    useEffect(() => {
      if (!selectedBatch) return;
      const packRate = Number(selectedBatch.saleRate);
      setEntry((prev) => ({
        ...prev,
        saleRate: packRate.toFixed(2),
        looseRate: (packRate / packingSize).toFixed(2),
      }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entry.batchId]);

    function set<K extends keyof EntryRowState>(
      key: K,
      value: EntryRowState[K],
    ) {
      setEntry((prev) => ({ ...prev, [key]: value }));
    }

    function handleProductChange(productId: string, productName?: string) {
      setEntry({ ...blankEntry, productId, productName: productName ?? "" });
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

    // Validates against the *effective* remaining stock — the pack portion
    // being entered can free up loose units too, mirroring backend logic.
    function validateQuantities(packQty: number, looseQty: number) {
      const nextErrors: Record<string, string> = {};
      if (selectedBatch) {
        const remainingPacks =
          selectedBatch.currentQuantity -
          usedPacksForBatch(selectedBatch.batchId);
        const remainingLoose =
          (selectedBatch.looseQuantity ?? 0) -
          usedLooseForBatch(selectedBatch.batchId);
        const availableLoose =
          Math.max(remainingLoose, 0) +
          Math.max(remainingPacks - packQty, 0) * packingSize;

        if (packQty > remainingPacks) {
          nextErrors.packQuantity = `Only ${remainingPacks} packs available`;
        }
        if (looseQty > availableLoose) {
          nextErrors.looseQuantity = `Only ${availableLoose} units available`;
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

    const netAmount =
      (Number(entry.packQuantity) || 0) * (Number(entry.saleRate) || 0) +
      (Number(entry.looseQuantity) || 0) * (Number(entry.looseRate) || 0);

    const commit = () => {
      const packQty = Number(entry.packQuantity) || 0;
      const looseQty = Number(entry.looseQuantity) || 0;

      if (selectedBatch) {
        const stockErrors = validateQuantities(packQty, looseQty);
        if (stockErrors.packQuantity || stockErrors.looseQuantity) return;
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
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
      requestAnimationFrame(() => {
        containerRef.current?.querySelector<HTMLElement>("input")?.focus();
      });
    };

    useImperativeHandle(ref, () => ({ commit }));

    function handleKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      // Keyboard-first path: Product -> Pack Qty -> Loose Qty -> Commit.
      // Batch stays outside this path since it's rarely changed.
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
          !
        </span>
      );
    }

    const expiryStatus = getExpiryStatus(entry.expiryDate);

    return (
      <tr
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className={`border-l-2 border-b border-gray-200 transition-colors duration-300 ${
          flash
            ? "bg-green-100 border-l-green-500"
            : "bg-blue-50/60 border-l-blue-400 hover:bg-blue-50"
        }`}
      >
        <td className="px-3 py-1.5">
          <div className="flex items-center gap-1">
            <ProductSelect
              value={entry.productId}
              onChange={handleProductChange}
              data-nav="true"
            />
            {errors.productId && <ErrorIcon message={errors.productId} />}
          </div>
        </td>

        {/* Batch — wide enough for Batch Number · Expiry · Expected Stock;
            deliberately outside the Enter/Tab fast path. */}
        <td className="px-3 py-1.5">
          <select
            value={entry.batchId}
            onChange={(e) => handleBatchChange(e.target.value)}
            disabled={!entry.productId || batches.length === 0}
            className="w-full min-w-[220px] border rounded px-2 py-1 text-sm bg-white disabled:bg-gray-50"
          >
            {batches.length === 0 && <option value="">No stock</option>}
            {batches.map((b) => {
              const exp = expectedStockFor(b);
              return (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchNumber} · Exp: {formatCompactExpiry(b.expiryDate)} · {" "}
                  {exp.packs} pk / {exp.loose} ls
                </option>
              );
            })}
          </select>
        </td>

        <td className="px-3 py-1.5 text-sm">
          <div className={expiryColorClass[expiryStatus]}>
            {formatCompactExpiry(entry.expiryDate)}
          </div>
        </td>

        {/* Quantity group — Pack primary, Loose secondary, framed as one
            logical concept rather than two unrelated fields. */}
        <td className="px-3 py-1.5">
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
                className={`w-full border rounded px-2 py-1 text-sm bg-white text-right font-medium ${
                  errors.packQuantity ? "border-red-400" : ""
                }`}
                placeholder="0"
                data-nav="true"
              />
              {errors.packQuantity && (
                <ErrorIcon message={errors.packQuantity} />
              )}
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
                className={`w-full border rounded px-1.5 py-0.5 text-xs bg-white text-right text-gray-600 disabled:bg-gray-50 ${
                  errors.looseQuantity ? "border-red-400" : ""
                }`}
                placeholder="0"
                data-nav="true"
              />
              {errors.looseQuantity && (
                <ErrorIcon message={errors.looseQuantity} />
              )}
            </div>
            {selectedExpected && (
              <span className="text-[10px] text-gray-400">
                Remaining: {selectedExpected.packs} packs ·{" "}
                {selectedExpected.loose} loose
              </span>
            )}
          </div>
        </td>

        {/* Rate group — Pack primary, Unit secondary and visibly derived. */}
        <td className="px-3 py-1.5">
          <div className="flex flex-col gap-0.5 items-end">
            <input
              type="number"
              step="0.01"
              value={entry.saleRate ? Number(entry.saleRate).toFixed(2) : ""}
              readOnly
              tabIndex={-1}
              title="Rate per pack, set by the selected batch"
              className={`w-full border-0 bg-transparent px-0 py-0.5 text-sm text-right font-medium text-gray-700 cursor-default focus:outline-none focus:ring-0 ${noSpinnerClass}`}
              placeholder="0.00"
            />
            <span className="text-[10px] text-gray-400">/ Pack</span>
            {packingSize > 1 && (
              <>
                <span
                  title="Derived from pack rate ÷ packing size — not directly editable"
                  className="text-xs text-gray-400 cursor-help"
                >
                  {entry.looseRate
                    ? Number(entry.looseRate).toFixed(2)
                    : "0.00"}
                </span>
                <span className="text-[10px] text-gray-400">/ Unit</span>
              </>
            )}
          </div>
        </td>

        <td className="px-3 py-1.5 text-right font-medium text-sm text-blue-700">
          {netAmount.toFixed(2)}
        </td>

        <td className="px-3 py-1.5 text-center">
          <button
            type="button"
            onClick={resetRow}
            title="Clear entry"
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  },
);

SaleEntryRow.displayName = "SaleEntryRow";
