"use client";

import { useState } from "react";
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

interface Props {
  index: number;
  control: Control<SaleFormInput>;
  setValue: UseFormSetValue<SaleFormInput>;
  onRemove: () => void;
  itemErrors?: Merge<FieldError, FieldErrorsImpl<SaleItemValues>>;
}

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

export function SaleItemRow({
  index,
  control,
  setValue,
  onRemove,
  itemErrors,
}: Props) {
  const item = useWatch({ control, name: `items.${index}` });

  const [isEditing, setIsEditing] = useState(false);
  const [draftPack, setDraftPack] = useState(0);
  const [draftLoose, setDraftLoose] = useState(0);

  const packQuantity = Number(item?.packQuantity) || 0;
  const looseQuantity = Number(item?.looseQuantity) || 0;
  const packingSize = Number(item?.packingSize) || 1;
  const saleRate = Number(item?.saleRate) || 0; // unit rate

  const unitQuantity = packQuantity * packingSize + looseQuantity;
  const netAmount = round2(unitQuantity * saleRate);

  function startEdit() {
    setDraftPack(packQuantity);
    setDraftLoose(looseQuantity);
    setIsEditing(true);
  }

  function saveEdit() {
    setValue(
      `items.${index}.packQuantity`,
      Math.max(0, Math.trunc(draftPack)),
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
    setValue(
      `items.${index}.looseQuantity`,
      Math.max(0, Math.trunc(draftLoose)),
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
    setIsEditing(false);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  return (
    <tr className="border-b border-[var(--color-border-light)] hover:bg-[var(--color-row-hover)] transition-[var(--transition-fast)]">
      <td className="px-3 py-1.5 text-sm text-[var(--color-text)]">
        {item?.productName ?? item?.productId}
      </td>
      <td className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)]">
        {item?.batchNumber || "—"}
      </td>
      <td className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)]">
        {formatCompactExpiry(item?.expiryDate)}
      </td>

      {/* Quantity — pack + unit */}
      <td className="px-3 py-1.5">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--color-text-placeholder)] w-8 shrink-0">
                Pack
              </span>
              <input
                type="number"
                autoFocus
                min={0}
                value={draftPack}
                onChange={(e) => setDraftPack(Number(e.target.value) || 0)}
                className="h-6 w-full rounded border border-[var(--color-border)] bg-[var(--color-input)] px-2 py-1 text-sm text-[var(--color-text)] text-right font-medium focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-[var(--transition-fast)]"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--color-text-placeholder)] w-8 shrink-0">
                Unit
              </span>
              <input
                type="number"
                min={0}
                value={draftLoose}
                onChange={(e) => setDraftLoose(Number(e.target.value) || 0)}
                className="h-6 w-full rounded border border-[var(--color-border)] bg-[var(--color-input)] px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)] text-right focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-[var(--transition-fast)]"
              />
            </div>
            {itemErrors?.packQuantity && (
              <div className="text-xs text-[var(--color-danger)] leading-none">
                {itemErrors.packQuantity.message}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-center">
            <span className="font-medium text-[var(--color-text)]">
              {packQuantity} Pack
            </span>
            {looseQuantity > 0 && (
              <span className="text-[var(--color-text-muted)]">
                {" "}
                · {looseQuantity} Unit
              </span>
            )}
          </div>
        )}
      </td>

      {/* Rate — unit only */}
      <td className="px-3 py-1.5">
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {saleRate.toFixed(2)}
          </span>
          <span className="text-[10px] text-[var(--color-text-placeholder)]">
            / Unit
          </span>
        </div>
      </td>

      <td className="px-3 py-1.5 text-right font-medium text-sm text-[var(--color-primary)]">
        {netAmount.toFixed(2)}
      </td>

      <td className="px-3 py-1.5 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={saveEdit}
              title="Save"
              className="text-[var(--color-success)] hover:text-[var(--color-success-text)] transition-[var(--transition-fast)]"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              title="Cancel"
              className="text-[var(--color-text-disabled)] hover:text-[var(--color-danger)] transition-[var(--transition-fast)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={startEdit}
              title="Edit"
              className="text-[var(--color-text-disabled)] hover:text-[var(--color-primary)] transition-[var(--transition-fast)]"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              title="Delete"
              className="text-[var(--color-text-disabled)] hover:text-[var(--color-danger)] transition-[var(--transition-fast)]"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
