"use client";

import {
  Control,
  FieldErrors,
  UseFormSetValue,
  FieldArrayWithId,
  Merge,
  FieldError,
  FieldErrorsImpl,
} from "react-hook-form";
import { SaleFormInput, SaleItemValues } from "@/schemas/sale-form";
import { SaleItemRow, SaleEntryRow, SaleEntryRowRef } from "../";
import { getColumns } from "@/constants/sale/table-columns";
import { forwardRef, Ref } from "react";
import { PosTableFooterToolbar } from "./PosTableFooterToolbar";

interface ItemsTableProps {
  onAddItem: (item: SaleItemValues) => void;
  fields: FieldArrayWithId<SaleFormInput, "items", "id">[];
  control: Control<SaleFormInput>;
  setValue: UseFormSetValue<SaleFormInput>;
  onRemove: (index: number) => void;
  errors: FieldErrors<SaleFormInput>;
  entryRowRef: Ref<SaleEntryRowRef>;
  // new
  heldCount: number;
  onHold: () => void;
  onRecallHeld: () => void;
  onClear: () => void;
}

export const ItemsTable = forwardRef<HTMLDivElement, ItemsTableProps>(
  (
    {
      onAddItem,
      fields,
      control,
      setValue,
      onRemove,
      errors,
      entryRowRef,
      heldCount,
      onHold,
      onRecallHeld,
      onClear,
    },
    ref,
  ) => {
    const columns = getColumns();

    return (
      <div
        ref={ref}
        className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs"
      >
        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <colgroup>
              {columns.map((col) => (
                <col key={col.key} style={{ width: col.width }} />
              ))}
            </colgroup>
            <thead className="bg-gray-100/70 border-b border-gray-200">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                      ["product", "batch", "expiry"].includes(col.key)
                        ? "text-left"
                        : "text-center"
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
                onAdd={onAddItem}
                existingItems={fields as unknown as SaleItemValues[]}
              />

              {/* Existing Items */}
              {fields.map((field, index) => {
                const itemErrors = errors.items?.[index] as
                  | Merge<FieldError, FieldErrorsImpl<SaleItemValues>>
                  | undefined;

                return (
                  <SaleItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    setValue={setValue}
                    onRemove={() => onRemove(index)}
                    itemErrors={itemErrors}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Error */}
        {errors.items?.message && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-200">
            <p className="text-xs text-red-600 font-medium">
              {errors.items.message}
            </p>
          </div>
        )}

        {/* New: action toolbar + shortcut strip, pinned to bottom */}
        <PosTableFooterToolbar
          hasItems={fields.length > 0}
          heldCount={heldCount}
          onHold={onHold}
          onRecallHeld={onRecallHeld}
          onClear={onClear}
        />
      </div>
    );
  },
);

ItemsTable.displayName = "ItemsTable";
