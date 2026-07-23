"use client";

import {
  Control,
  UseFormRegister,
  useWatch,
  Merge,
  FieldError,
  FieldErrorsImpl,
} from "react-hook-form";
import { Trash2 } from "lucide-react";
import { SaleFormInput, SaleItemValues } from "@/schemas/sale-form";
import { calculateSaleItemAmounts } from "@/lib/sale-calculations";

interface Props {
  index: number;
  control: Control<SaleFormInput>;
  register: UseFormRegister<SaleFormInput>;
  onRemove: () => void;
  itemErrors?: Merge<FieldError, FieldErrorsImpl<SaleItemValues>>;
  showAdvanced: boolean;
}

export function SaleItemRow({
  index,
  control,
  register,
  onRemove,
  itemErrors,
  showAdvanced,
}: Props) {
  const item = useWatch({ control, name: `items.${index}` });

  const amounts = calculateSaleItemAmounts({
    quantity: Number(item?.quantity) || 0,
    saleRate: Number(item?.saleRate) || 0,
    discountPercent: Number(item?.discountPercent) || 0,
    taxPercent: Number(item?.taxPercent) || 0,
  });

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60">
      <td className="px-3 py-2 text-sm text-gray-800">
        {item?.productName ?? item?.productId}
      </td>
      <td className="px-3 py-2 text-sm text-gray-600">
        {item?.batchNumber || "—"}
      </td>
      <td className="px-3 py-2 text-sm text-gray-600">
        {item?.expiryDate
          ? new Date(item.expiryDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—"}
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          {...register(`items.${index}.quantity`)}
          className="w-full border rounded px-2 py-1 text-sm bg-white"
        />
        {itemErrors?.quantity && (
          <div className="text-xs text-red-600 mt-0.5 leading-none">
            {itemErrors.quantity.message}
          </div>
        )}
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          step="0.01"
          {...register(`items.${index}.saleRate`)}
          className="w-full border rounded px-2 py-1 text-sm bg-white"
        />
        {itemErrors?.saleRate && (
          <div className="text-xs text-red-600 mt-0.5 leading-none">
            {itemErrors.saleRate.message}
          </div>
        )}
      </td>

      {showAdvanced && (
        <>
          <td className="px-3 py-2">
            <input
              type="number"
              step="0.01"
              {...register(`items.${index}.discountPercent`)}
              className="w-full border rounded px-2 py-1 text-sm bg-white"
            />
          </td>
          <td className="px-3 py-2">
            <input
              type="number"
              step="0.01"
              {...register(`items.${index}.taxPercent`)}
              className="w-full border rounded px-2 py-1 text-sm bg-white"
            />
          </td>
          <td className="px-3 py-2 text-right text-sm text-gray-600">
            {amounts.grossAmount.toFixed(2)}
          </td>
          <td className="px-3 py-2 text-right text-sm text-gray-600">
            {amounts.discountAmount.toFixed(2)}
          </td>
          <td className="px-3 py-2 text-right text-sm text-gray-600">
            {amounts.taxAmount.toFixed(2)}
          </td>
        </>
      )}

      <td className="px-3 py-2 text-right font-medium text-sm text-blue-700">
        {amounts.netAmount.toFixed(2)}
      </td>
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
