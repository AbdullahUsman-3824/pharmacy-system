import {
  Control,
  useWatch,
  UseFormRegister,
  Controller,
  FieldErrors,
} from "react-hook-form";
import { calculateItemAmounts } from "../../../lib/stock-calculations";
import { StockVoucherFormInput } from "@/schemas/stockVoucher";
import { ProductSelect } from "../../ProductSelect";

interface Props {
  index: number;
  control: Control<StockVoucherFormInput>;
  register: UseFormRegister<StockVoucherFormInput>;
  onRemove: () => void;
  itemErrors?: FieldErrors<StockVoucherFormInput["items"][number]>;
  showAdvanced: boolean;
}

export function StockVoucherItemRow({
  index,
  control,
  register,
  onRemove,
  itemErrors,
  showAdvanced,
}: Props) {
  const item = useWatch({ control, name: `items.${index}` });

  const amounts = calculateItemAmounts({
    quantity: Number(item?.quantity) || 0,
    purchaseRate: Number(item?.purchaseRate) || 0,
    discountPercent: Number(item?.discountPercent) || 0,
    taxPercent: Number(item?.taxPercent) || 0,
  });

  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="px-3 py-2.5">
        <Controller
          control={control}
          name={`items.${index}.productId`}
          render={({ field }) => (
            <ProductSelect value={field.value} onChange={field.onChange} />
          )}
        />
        {itemErrors?.productId && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.productId.message}
          </div>
        )}
      </td>
      <td className="px-3 py-2.5">
        <input
          {...register(`items.${index}.batchNumber`)}
          className="w-full border rounded px-2 py-1.5 text-sm"
        />
        {itemErrors?.batchNumber && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.batchNumber.message}
          </div>
        )}
      </td>
      <td className="px-3 py-2.5">
        <input
          type="date"
          {...register(`items.${index}.expiryDate`)}
          className="w-full border rounded px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          {...register(`items.${index}.quantity`)}
          className="w-full border rounded px-2 py-1.5 text-sm"
        />
        {itemErrors?.quantity && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.quantity.message}
          </div>
        )}
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          step="0.01"
          {...register(`items.${index}.purchaseRate`)}
          className="w-full border rounded px-2 py-1.5 text-sm"
        />
        {itemErrors?.purchaseRate && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.purchaseRate.message}
          </div>
        )}
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          step="0.01"
          {...register(`items.${index}.saleRate`)}
          className="w-full border rounded px-2 py-1.5 text-sm"
        />
        {itemErrors?.saleRate && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.saleRate.message}
          </div>
        )}
      </td>

      {showAdvanced && (
        <>
          <td className="px-3 py-2.5">
            <input
              type="number"
              {...register(`items.${index}.freeQuantity`)}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </td>
          <td className="px-3 py-2.5">
            <input
              type="number"
              step="0.01"
              {...register(`items.${index}.discountPercent`)}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </td>
          <td className="px-3 py-2.5">
            <input
              type="number"
              step="0.01"
              {...register(`items.${index}.taxPercent`)}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </td>
          <td className="px-3 py-2.5 text-right tabular-nums text-sm text-gray-600">
            {amounts.grossAmount.toFixed(2)}
          </td>
          <td className="px-3 py-2.5 text-right tabular-nums text-sm text-gray-600">
            {amounts.discountAmount.toFixed(2)}
          </td>
          <td className="px-3 py-2.5 text-right tabular-nums text-sm text-gray-600">
            {amounts.taxAmount.toFixed(2)}
          </td>
        </>
      )}

      <td className="px-3 py-2.5 text-right font-medium tabular-nums text-sm">
        {amounts.netAmount.toFixed(2)}
      </td>
      <td className="px-3 py-2.5 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
