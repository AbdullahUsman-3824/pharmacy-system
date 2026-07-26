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
  const saleRate = Number(item?.saleRate) || 0;
  const looseRate = Number(item?.looseRate) || 0;
  const netAmount = packQuantity * saleRate + looseQuantity * looseRate;

  function startEdit() {
    setDraftPack(packQuantity);
    setDraftLoose(looseQuantity);
    setIsEditing(true);
  }

  function saveEdit() {
    setValue(`items.${index}.packQuantity`, draftPack, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`items.${index}.looseQuantity`, draftLoose, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setIsEditing(false);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60">
      <td className="px-3 py-1.5 text-sm text-gray-800">
        {item?.productName ?? item?.productId}
      </td>
      <td className="px-3 py-1.5 text-sm text-gray-600">
        {item?.batchNumber || "—"}
      </td>
      <td className="px-3 py-1.5 text-sm text-gray-600">
        {formatCompactExpiry(item?.expiryDate)}
      </td>

      {/* Quantity group — read-only text by default, two inputs while editing */}
      <td className="px-3 py-1.5">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 w-8 shrink-0">
                Pack
              </span>
              <input
                type="number"
                autoFocus
                value={draftPack}
                onChange={(e) => setDraftPack(Number(e.target.value) || 0)}
                className="w-full border rounded px-2 py-1 text-sm bg-white text-right font-medium"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 w-8 shrink-0">
                Unit
              </span>
              <input
                type="number"
                value={draftLoose}
                onChange={(e) => setDraftLoose(Number(e.target.value) || 0)}
                className="w-full border rounded px-1.5 py-0.5 text-xs bg-white text-right text-gray-600"
              />
            </div>
            {itemErrors?.packQuantity && (
              <div className="text-xs text-red-600 leading-none">
                {itemErrors.packQuantity.message}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-right">
            <span className="font-medium text-gray-800">
              {packQuantity} Pack
            </span>
            {looseQuantity > 0 && (
              <span className="text-gray-500"> · {looseQuantity} Unit</span>
            )}
          </div>
        )}
      </td>

      {/* Rate group — always read-only, same as entry row */}
      <td className="px-3 py-1.5">
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-sm font-medium text-gray-700">
            {saleRate.toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-400">/ Pack</span>
          {looseQuantity > 0 && (
            <>
              <span className="text-xs text-gray-400">
                {looseRate.toFixed(2)}
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
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={saveEdit}
              title="Save"
              className="text-green-600 hover:text-green-700 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              title="Cancel"
              className="text-gray-400 hover:text-red-600 transition-colors"
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
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              title="Delete"
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
