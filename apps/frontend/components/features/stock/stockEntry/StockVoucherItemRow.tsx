import {
  Control,
  useWatch,
  UseFormRegister,
  FieldErrors,
} from "react-hook-form";
import { calculateItemAmounts } from "../../../../lib/stock-calculations";
import {
  StockVoucherFormInput,
  StockVoucherItemValues,
} from "@/schemas/stock-voucher";
import { Edit, Trash2 } from "lucide-react";

interface Props {
  index: number;
  control: Control<StockVoucherFormInput>;
  register: UseFormRegister<StockVoucherFormInput>; // still needed for validation, but we won't render inputs
  onRemove: () => void;
  onEdit: (item: StockVoucherItemValues) => void; // new
  itemErrors?: FieldErrors<StockVoucherFormInput["items"][number]>;
  showAdvanced: boolean;
  products?: Record<string, string>; // productId -> productName
}

// Coerces the raw (input-typed) watched item into a fully-resolved,
// output-typed item, matching what zod would produce after parsing.
function toItemValues(
  item: StockVoucherFormInput["items"][number] | undefined,
): StockVoucherItemValues {
  return {
    productId: item?.productId ?? "",
    batchNumber: item?.batchNumber ?? "",
    expiryDate: item?.expiryDate ?? undefined,
    quantity: Number(item?.quantity) || 0,
    freeQuantity: Number(item?.freeQuantity) || 0,
    purchaseRate: Number(item?.purchaseRate) || 0,
    saleRate: Number(item?.saleRate) || 0,
    discountPercent: Number(item?.discountPercent) || 0,
    taxPercent: Number(item?.taxPercent) || 0,
  };
}

export function StockVoucherItemRow({
  index,
  control,
  onRemove,
  onEdit,
  itemErrors,
  showAdvanced,
  products = {},
}: Props) {
  const item = useWatch({ control, name: `items.${index}` });
  const resolved = toItemValues(item);

  const amounts = calculateItemAmounts({
    quantity: resolved.quantity,
    purchaseRate: resolved.purchaseRate,
    discountPercent: resolved.discountPercent,
    taxPercent: resolved.taxPercent,
  });

  const productName = resolved.productId
    ? products[resolved.productId] || resolved.productId
    : "";

  const handleEdit = () => {
    if (item) {
      onRemove();
      onEdit(resolved);
    }
  };

  return (
    <tr className="border-b border-gray-100 align-top">
      {/* Product */}
      <td className="px-3 py-2.5">
        <span className="text-sm">{productName}</span>
        {itemErrors?.productId && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.productId.message}
          </div>
        )}
      </td>

      {/* Batch Number */}
      <td className="px-3 py-2.5">
        <span className="text-sm">{resolved.batchNumber}</span>
        {itemErrors?.batchNumber && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.batchNumber.message}
          </div>
        )}
      </td>

      {/* Expiry Date */}
      <td className="px-3 py-2.5">
        <span className="text-sm">{resolved.expiryDate || ""}</span>
      </td>

      {/* Quantity */}
      <td className="px-3 py-2.5">
        <span className="text-sm">{resolved.quantity}</span>
        {itemErrors?.quantity && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.quantity.message}
          </div>
        )}
      </td>

      {/* Purchase Rate */}
      <td className="px-3 py-2.5">
        <span className="text-sm">{resolved.purchaseRate}</span>
        {itemErrors?.purchaseRate && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.purchaseRate.message}
          </div>
        )}
      </td>

      {/* Sale Rate */}
      <td className="px-3 py-2.5">
        <span className="text-sm">{resolved.saleRate}</span>
        {itemErrors?.saleRate && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.saleRate.message}
          </div>
        )}
      </td>

      {showAdvanced && (
        <>
          <td className="px-3 py-2.5">
            <span className="text-sm">{resolved.freeQuantity}</span>
          </td>
          <td className="px-3 py-2.5">
            <span className="text-sm">{resolved.discountPercent}</span>
          </td>
          <td className="px-3 py-2.5">
            <span className="text-sm">{resolved.taxPercent}</span>
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

      {/* Actions: Edit + Remove */}
      <td className="px-3 py-2.5 text-center">
        <button
          type="button"
          onClick={handleEdit}
          className="text-blue-600 hover:text-blue-700 mr-2"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
