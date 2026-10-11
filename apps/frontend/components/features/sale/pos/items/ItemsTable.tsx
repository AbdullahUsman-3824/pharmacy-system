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
import { forwardRef, Ref, useCallback } from "react";

import { SaleFormInput, SaleItemValues } from "@/schemas/sale-form";
import { SaleItemRow, SaleEntryRow, SaleEntryRowRef } from "..";
import { getColumns } from "@/constants/sale/table-columns";
import { PosTableFooterToolbar } from "./PosTableFooterToolbar";
import { useTableKeyNav } from "@/hooks/useTableKeyNav";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ItemsTableProps {
  onAddItem: (item: SaleItemValues) => void;
  fields: FieldArrayWithId<SaleFormInput, "items", "id">[];
  control: Control<SaleFormInput>;
  setValue: UseFormSetValue<SaleFormInput>;
  onRemove: (index: number) => void;
  errors: FieldErrors<SaleFormInput>;
  entryRowRef: Ref<SaleEntryRowRef>;
  heldCount: number;
  onHold: () => void;
  onRecallHeld: () => void;
  onClear: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

    // ── Keyboard navigation ─────────────────────────────────────────────────
    // useTableKeyNav:
    //  - pushes "table" ShortcutContext on mount → activates ↑ ↓ Delete etc.
    //  - returns getRowProps(i) to spread on each <tr>
    //  - tbodyRef must be attached to <tbody> for the capture-phase listener

    const handleEdit = useCallback(
      (_row: FieldArrayWithId<SaleFormInput, "items", "id">, _index: number) => {
        // Enter triggers edit-mode inside SaleItemRow's own onKeyDown.
        // Nothing extra needed here — the row receives the keydown first
        // because it's a descendant of tbody and handles it with stopPropagation.
      },
      [],
    );

    const handleDelete = useCallback(
      (_row: FieldArrayWithId<SaleFormInput, "items", "id">, index: number) => {
        onRemove(index);
      },
      [onRemove],
    );

    const { getRowProps, tbodyRef } = useTableKeyNav({
      rows: fields,
      onEdit: handleEdit,
      onDelete: handleDelete,
      wrap: false,
      homeEnd: true,
      activeAttr: "active",
      // "table" context is managed by the hook; don't double-push it.
      manageContext: true,
    });

    // ── Render ──────────────────────────────────────────────────────────────

    return (
      <div
        ref={ref}
        className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs"
      >
        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table
            className="w-full text-sm"
            role="grid"
            aria-label="Sale items"
            aria-rowcount={fields.length + 1 /* +1 for entry row */}
          >
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
                    scope="col"
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

            {/*
             * tbodyRef is attached here so useTableKeyNav's capture-phase
             * keydown listener is scoped to the item rows only (not the
             * entry row above).
             */}
            <tbody ref={tbodyRef as React.Ref<HTMLTableSectionElement>}>
              {/* Entry row — always first, not part of roving tabindex */}
              <SaleEntryRow
                ref={entryRowRef}
                onAdd={onAddItem}
                existingItems={fields as unknown as SaleItemValues[]}
              />

              {/* Existing items — each gets roving tabindex + active props */}
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
                    navProps={getRowProps(index)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Validation error banner */}
        {errors.items?.message && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-200">
            <p className="text-xs text-red-600 font-medium">
              {errors.items.message}
            </p>
          </div>
        )}

        {/* Footer toolbar + shortcut strip */}
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
