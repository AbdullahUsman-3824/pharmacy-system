"use client";

import {
  Control,
  FieldErrors,
  UseFormRegister,
  FieldArrayWithId,
  Merge,
  FieldError,
  FieldErrorsImpl,
} from "react-hook-form";
import { SaleFormInput, SaleItemValues } from "@/schemas/sale-form";
import { SaleItemRow, SaleEntryRow, SaleEntryRowRef } from "../";
import { getColumns } from "@/constants/sale/table-columns";
import { SlidersHorizontal, Plus } from "lucide-react";
import { forwardRef, Ref } from "react";

interface ItemsTableProps {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onAddItem: (item: SaleItemValues) => void;
  fields: FieldArrayWithId<SaleFormInput, "items", "id">[];
  control: Control<SaleFormInput>;
  register: UseFormRegister<SaleFormInput>;
  onRemove: (index: number) => void;
  errors: FieldErrors<SaleFormInput>;
  entryRowRef: Ref<SaleEntryRowRef>;
  handleAddButtonClick: () => void;
}

export const ItemsTable = forwardRef<HTMLDivElement, ItemsTableProps>(
  (
    {
      showAdvanced,
      onToggleAdvanced,
      onAddItem,
      fields,
      control,
      register,
      onRemove,
      errors,
      entryRowRef,
      handleAddButtonClick,
    },
    ref,
  ) => {
    const columns = getColumns(showAdvanced);

    return (
      <div
        ref={ref}
        className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 min-h-[400px]"
      >
        {/* Table Header Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0 bg-gray-50/50 rounded-t-xl">
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-medium">
              {showAdvanced ? "Hide" : "Show"} discount &amp; tax fields
            </span>
          </button>
          <button
            type="button"
            onClick={handleAddButtonClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
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
                    className={`px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${
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
              {/* Add Entry Row */}
              <SaleEntryRow
                ref={entryRowRef}
                showAdvanced={showAdvanced}
                onAdd={onAddItem}
              />

              {/* Existing Items */}
              {fields.map((field, index) => {
                // Get errors for this specific item and cast to the expected type
                const itemErrors = errors.items?.[index] as
                  | Merge<FieldError, FieldErrorsImpl<SaleItemValues>>
                  | undefined;

                return (
                  <SaleItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    register={register}
                    onRemove={() => onRemove(index)}
                    itemErrors={itemErrors}
                    showAdvanced={showAdvanced}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Error */}
        {errors.items?.message && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-200 rounded-b-xl">
            <p className="text-xs text-red-600 font-medium">
              {errors.items.message}
            </p>
          </div>
        )}
      </div>
    );
  },
);

ItemsTable.displayName = "ItemsTable";
