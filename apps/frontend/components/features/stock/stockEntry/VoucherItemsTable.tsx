"use client";

import { RefObject } from "react";
import {
  Control,
  UseFormRegister,
  FieldErrors,
  FieldArrayWithId,
} from "react-hook-form";
import {
  StockVoucherFormInput,
  StockVoucherItemValues,
} from "@/schemas/stock-voucher";
import { getColumns } from "@/constants/stock/table-columns";
import {
  StockVoucherEntryRow,
  StockVoucherEntryRowRef,
} from "./VoucherEntryRow";
import { StockVoucherItemRow } from "./VoucherItemRow";
import { SlidersHorizontal, Plus } from "lucide-react";
import Button from "@/components/ui/button";

interface Props {
  // table state
  fields: FieldArrayWithId<StockVoucherFormInput, "items">[];
  control: Control<StockVoucherFormInput>;
  register: UseFormRegister<StockVoucherFormInput>;
  errors: FieldErrors<StockVoucherFormInput>;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;

  // entry row
  entryRowRef: RefObject<StockVoucherEntryRowRef | null>;
  productNames: Record<string, string>;
  onAdd: (item: StockVoucherItemValues, productName: string) => void;
  onEdit: (item: StockVoucherItemValues) => void;
  onRemove: (index: number) => void;
  onProductPicked: (productId: string) => void;
  onAddButtonClick: () => void;
}

export function VoucherItemsTable({
  fields,
  control,
  register,
  errors,
  showAdvanced,
  onToggleAdvanced,
  entryRowRef,
  productNames,
  onAdd,
  onEdit,
  onRemove,
  onProductPicked,
  onAddButtonClick,
}: Props) {
  const columns = getColumns(showAdvanced);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 min-h-[400px]">
      {/* toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 shrink-0">
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {showAdvanced ? "Hide" : "Show"} discount &amp; tax fields
        </button>
        <Button onClick={onAddButtonClick}>
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                    ["product", "batch", "expiry"].includes(col.key)
                      ? "text-left"
                      : col.key === "actions"
                        ? "text-center"
                        : "text-right"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <StockVoucherEntryRow
              ref={entryRowRef}
              showAdvanced={showAdvanced}
              onAdd={onAdd}
              onProductPicked={onProductPicked}
            />
            {fields.map((field, index) => (
              <StockVoucherItemRow
                key={field.id}
                index={index}
                control={control}
                register={register}
                onRemove={() => onRemove(index)}
                onEdit={onEdit}
                itemErrors={errors.items?.[index]}
                showAdvanced={showAdvanced}
                products={productNames}
              />
            ))}
          </tbody>
        </table>
      </div>

      {errors.items?.message && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 shrink-0">
          <p className="text-xs text-red-600">{errors.items.message}</p>
        </div>
      )}
    </div>
  );
}
