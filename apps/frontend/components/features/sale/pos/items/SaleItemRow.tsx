"use client";

import { useCallback, useState } from "react";
import {
  Control,
  UseFormSetValue,
  useWatch,
  Merge,
  FieldError,
  FieldErrorsImpl,
} from "react-hook-form";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import { SaleFormInput, SaleItemValues } from "@/schemas/sale-form";
import type { TableRowNavProps } from "@/hooks/useTableKeyNav";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  index: number;
  control: Control<SaleFormInput>;
  setValue: UseFormSetValue<SaleFormInput>;
  onRemove: () => void;
  itemErrors?: Merge<FieldError, FieldErrorsImpl<SaleItemValues>>;
  /**
   * Roving-tabindex + active-row props from useTableKeyNav.
   * Spread directly onto <tr>. Optional so the row still renders standalone.
   */
  navProps?: TableRowNavProps;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCompactExpiry(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = String(d.getFullYear()).slice(-2);
  return `${month}-${year}`;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SaleItemRow({
  index,
  control,
  setValue,
  onRemove,
  itemErrors,
  navProps,
}: Props) {
  const item = useWatch({ control, name: `items.${index}` });

  const [isEditing, setIsEditing] = useState(false);
  const [draftPack, setDraftPack] = useState(0);
  const [draftLoose, setDraftLoose] = useState(0);

  const packQuantity = Number(item?.packQuantity) || 0;
  const looseQuantity = Number(item?.looseQuantity) || 0;
  const packingSize = Number(item?.packingSize) || 1;
  const saleRate = Number(item?.saleRate) || 0;

  const unitQuantity = packQuantity * packingSize + looseQuantity;
  const netAmount = round2(unitQuantity * saleRate);

  const isActive = navProps?.["data-active"] === "true";

  // ── Edit mode helpers ─────────────────────────────────────────────────────

  const startEdit = useCallback(() => {
    setDraftPack(packQuantity);
    setDraftLoose(looseQuantity);
    setIsEditing(true);
  }, [packQuantity, looseQuantity]);

  const saveEdit = useCallback(() => {
    setValue(`items.${index}.packQuantity`, Math.max(0, Math.trunc(draftPack)), {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`items.${index}.looseQuantity`, Math.max(0, Math.trunc(draftLoose)), {
      shouldValidate: true,
      shouldDirty: true,
    });
    setIsEditing(false);
  }, [index, draftPack, draftLoose, setValue]);

  const cancelEdit = useCallback(() => setIsEditing(false), []);

  // ── Keyboard handling on the <tr> ─────────────────────────────────────────
  // Intercept keys that useTableKeyNav doesn't handle:
  //   Enter (when NOT in edit mode) → start edit
  //   Enter (when in edit mode)     → save edit
  //   Escape (when in edit mode)    → cancel edit
  //   Ctrl+S (when in edit mode)    → save edit
  //
  // Note: Delete / arrow keys are handled by useTableKeyNav at the tbody level.

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (isEditing) {
        if (e.key === "Enter" || (e.key === "s" && e.ctrlKey)) {
          e.preventDefault();
          e.stopPropagation();
          saveEdit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cancelEdit();
        }
        return;
      }

      if (e.key === "Enter") {
        // Don't intercept Enter when focus is already inside an interactive
        // child (e.g. the Edit/Delete buttons).
        const target = e.target as HTMLElement;
        const isButton = target.tagName === "BUTTON" || target.closest("button");
        if (!isButton) {
          e.preventDefault();
          e.stopPropagation();
          startEdit();
        }
      }
    },
    [isEditing, saveEdit, cancelEdit, startEdit],
  );

  // ── Row classes ───────────────────────────────────────────────────────────
  // Active row gets a stronger highlight and a left border accent.

  const rowClass = [
    "border-b border-[var(--color-border-light)] transition-colors duration-150",
    isActive
      ? "bg-[var(--color-row-selected)] outline outline-1 outline-[var(--color-primary-border)] shadow-[inset_3px_0_0_var(--color-primary)]"
      : "hover:bg-[var(--color-row-hover)]",
  ].join(" ");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <tr
      {...(navProps ?? {})}
      className={rowClass}
      onKeyDown={handleKeyDown}
      aria-selected={isActive}
      // Allow the row itself to receive focus for roving tabindex.
      // navProps already sets tabIndex, but we need it on <tr> specifically.
    >
      {/* Product name */}
      <td className="px-3 py-1.5 text-sm text-[var(--color-text)]">
        {item?.productName ?? item?.productId}
      </td>

      {/* Batch */}
      <td className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)]">
        {item?.batchNumber || "—"}
      </td>

      {/* Expiry */}
      <td className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)]">
        {formatCompactExpiry(item?.expiryDate)}
      </td>

      {/* Quantity */}
      <td className="px-3 py-1.5">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="w-8 shrink-0 text-[10px] text-[var(--color-text-placeholder)]">
                Pack
              </span>
              <input
                type="number"
                autoFocus
                min={0}
                value={draftPack}
                onChange={(e) => setDraftPack(Number(e.target.value) || 0)}
                onKeyDown={(e) => {
                  // Enter inside input advances to loose field or saves.
                  if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); saveEdit(); }
                }}
                className="h-6 w-full rounded border border-[var(--color-border)] bg-[var(--color-input)] px-2 py-1 text-right text-sm font-medium text-[var(--color-text)] transition-[var(--transition-fast)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="w-8 shrink-0 text-[10px] text-[var(--color-text-placeholder)]">
                Unit
              </span>
              <input
                type="number"
                min={0}
                value={draftLoose}
                onChange={(e) => setDraftLoose(Number(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); saveEdit(); }
                }}
                className="h-6 w-full rounded border border-[var(--color-border)] bg-[var(--color-input)] px-1.5 py-0.5 text-right text-xs text-[var(--color-text-secondary)] transition-[var(--transition-fast)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            {itemErrors?.packQuantity && (
              <div className="text-xs leading-none text-[var(--color-danger)]">
                {itemErrors.packQuantity.message}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-sm">
            <span className="font-medium text-[var(--color-text)]">
              {packQuantity} Pack
            </span>
            {looseQuantity > 0 && (
              <span className="text-[var(--color-text-muted)]">
                {" "}· {looseQuantity} Unit
              </span>
            )}
          </div>
        )}
      </td>

      {/* Rate */}
      <td className="px-3 py-1.5">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {saleRate.toFixed(2)}
          </span>
          <span className="text-[10px] text-[var(--color-text-placeholder)]">/ Unit</span>
        </div>
      </td>

      {/* Net amount */}
      <td className="px-3 py-1.5 text-right text-sm font-medium text-[var(--color-primary)]">
        {netAmount.toFixed(2)}
      </td>

      {/* Actions */}
      <td className="px-3 py-1.5 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={saveEdit}
              title="Save (Enter)"
              aria-label="Save edit"
              className="text-[var(--color-success)] transition-[var(--transition-fast)] hover:text-[var(--color-success-text)]"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              title="Cancel (Esc)"
              aria-label="Cancel edit"
              className="text-[var(--color-text-disabled)] transition-[var(--transition-fast)] hover:text-[var(--color-danger)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={startEdit}
              title="Edit (Enter)"
              aria-label="Edit row"
              className="text-[var(--color-text-disabled)] transition-[var(--transition-fast)] hover:text-[var(--color-primary)]"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              title="Delete (Del)"
              aria-label="Delete row"
              className="text-[var(--color-text-disabled)] transition-[var(--transition-fast)] hover:text-[var(--color-danger)]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
