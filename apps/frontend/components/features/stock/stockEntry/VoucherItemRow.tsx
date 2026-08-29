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
  register: UseFormRegister<StockVoucherFormInput>;
  onRemove: () => void;
  onEdit: (item: StockVoucherItemValues) => void;
  itemErrors?: FieldErrors<StockVoucherFormInput["items"][number]>;
  showAdvanced: boolean;
  products?: Record<string, string>;
}

function toItemValues(
  item: StockVoucherFormInput["items"][number] | undefined,
): StockVoucherItemValues {
  return {
    productId: item?.productId ?? "",
    batchNumber: item?.batchNumber ?? "",
    expiryDate: item?.expiryDate ?? undefined,
    packingSize: Number(item?.packingSize) || 1,
    packQuantity: Number(item?.packQuantity) || 0,
    looseQuantity: Number(item?.looseQuantity) || 0,
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
    packQuantity: resolved.packQuantity,
    looseQuantity: resolved.looseQuantity,
    purchaseRate: resolved.purchaseRate,
    packingSize: resolved.packingSize,
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
      <td className="px-3 py-2.5">
        <span className="text-sm">{productName}</span>
        {itemErrors?.productId && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.productId.message}
          </div>
        )}
      </td>

      <td className="px-3 py-2.5">
        <span className="text-sm">{resolved.batchNumber}</span>
        {itemErrors?.batchNumber && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.batchNumber.message}
          </div>
        )}
      </td>

      <td className="px-3 py-2.5">
        <span className="text-sm">{resolved.expiryDate || ""}</span>
      </td>

      <td className="px-3 py-2.5">
        <span className="text-sm">{resolved.packQuantity}</span>
        {itemErrors?.packQuantity && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.packQuantity.message}
          </div>
        )}
      </td>

      <td className="px-3 py-2.5">
        <span className="text-sm">{resolved.looseQuantity}</span>
        {itemErrors?.looseQuantity && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.looseQuantity.message}
          </div>
        )}
      </td>

      <td className="px-3 py-2.5">
        <span className="text-sm">{resolved.purchaseRate}</span>
        {itemErrors?.purchaseRate && (
          <div className="text-xs text-red-600 mt-0.5">
            {itemErrors.purchaseRate.message}
          </div>
        )}
      </td>

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
