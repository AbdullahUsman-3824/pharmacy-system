import { ReactNode, useMemo } from "react";
import { cn } from "@/lib/cn";
import EmptyState from "./empty-state";
import LoadingState from "./loading-state";

export type SortDirection = "asc" | "desc";

export interface DataTableColumn<T> {
  key: string;
  dataKey?: keyof T;
  title: ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey?: (row: T) => string | number;

  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;

  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  className?: string;
  footer?: ReactNode;
  stickyHeader?: boolean;
  zebra?: boolean;

  // Sorting is controlled — parent owns the state, DataTable stays pure
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;

  // Selection
  selectable?: boolean;
  selectedRows?: Array<string | number>;
  onSelectionChange?: (rows: Array<string | number>) => void;
}

function defaultRowKey<T extends { id?: string | number }>(
  row: T,
  index: number,
) {
  return row.id ?? index;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyTitle = "No data found",
  emptyDescription,
  onRowClick,
  footer,
  stickyHeader = false,
  zebra = false,
  className,
  rowClassName,
  sortKey,
  sortDirection,
  onSort,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
}: DataTableProps<T>) {
  const getRowKey = rowKey ?? defaultRowKey;

  const selectedSet = useMemo(() => new Set(selectedRows), [selectedRows]);
  const allKeys = useMemo(
    () => data.map((row, i) => getRowKey(row, i)),
    [data, getRowKey],
  );
  const allSelected =
    data.length > 0 && allKeys.every((k) => selectedSet.has(k));
  const someSelected = allKeys.some((k) => selectedSet.has(k)) && !allSelected;

  function toggleAll() {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : allKeys);
  }

  function toggleRow(key: string | number) {
    if (!onSelectionChange) return;
    const next = selectedSet.has(key)
      ? selectedRows.filter((k) => k !== key)
      : [...selectedRows, key];
    onSelectionChange(next);
  }

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortable || !onSort) return;
    const nextDirection: SortDirection =
      sortKey === column.key && sortDirection === "asc" ? "desc" : "asc";
    onSort(column.key, nextDirection);
  }

  function handleRowKeyDown(e: React.KeyboardEvent, row: T) {
    if (!onRowClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  }

  const colCount = columns.length + (selectable ? 1 : 0);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead
            className={cn(
              "border-b border-[var(--color-border)] bg-[var(--color-background-muted)]",
              stickyHeader && "sticky top-0 z-10",
            )}
          >
            <tr>
              {selectable && (
                <th className="h-12 w-10 px-5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="cursor-pointer"
                  />
                </th>
              )}

              {columns.map((column) => {
                const isSorted = sortKey === column.key;
                return (
                  <th
                    key={column.key}
                    style={{
                      width:
                        typeof column.width === "number"
                          ? `${column.width}px`
                          : column.width,
                    }}
                    aria-sort={
                      isSorted
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    onClick={() => handleSort(column)}
                    className={cn(
                      "h-12 whitespace-nowrap px-5 text-sm font-semibold text-[var(--color-text-secondary)]",
                      column.align === "left" && "text-left",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.sortable &&
                        "cursor-pointer select-none transition-colors hover:text-[var(--color-text)]",
                      column.headerClassName,
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        column.align === "center" && "justify-center",
                        column.align === "right" && "justify-end",
                      )}
                    >
                      {column.title}
                      {column.sortable && (
                        <span
                          className={cn(
                            "text-xs transition-opacity",
                            isSorted ? "opacity-100" : "opacity-40",
                          )}
                        >
                          {isSorted
                            ? sortDirection === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="p-0">
                  <LoadingState />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="p-0">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = getRowKey(row, index);
                const isSelected = selectedSet.has(key);

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(e) => handleRowKeyDown(e, row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    className={cn(
                      "border-b border-[var(--color-border-light)] transition-colors",
                      "last:border-b-0",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:-outline-offset-2",
                      zebra &&
                        index % 2 === 1 &&
                        "bg-[var(--color-background-muted)]/40",
                      isSelected && "bg-[var(--color-primary)]/5",
                      onRowClick &&
                        "cursor-pointer hover:bg-[var(--color-row-hover)]",
                      rowClassName?.(row),
                    )}
                  >
                    {selectable && (
                      <td
                        className="w-10 px-5 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(key)}
                          aria-label="Select row"
                          className="cursor-pointer"
                        />
                      </td>
                    )}

                    {columns.map((column) => {
                      const value = column.dataKey
                        ? row[column.dataKey]
                        : undefined;

                      return (
                        <td
                          key={column.key}
                          className={cn(
                            "px-5 py-3 whitespace-nowrap align-middle text-sm text-[var(--color-text)]",
                            column.align === "left" && "text-left",
                            column.align === "center" && "text-center",
                            column.align === "right" && "text-right",
                            column.className,
                          )}
                        >
                          {column.render
                            ? column.render(row, index)
                            : value === null || value === undefined
                              ? "—"
                              : typeof value === "boolean"
                                ? value
                                  ? "Yes"
                                  : "No"
                                : String(value)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {footer && (
        <div className="border-t border-[var(--color-border)] px-5 py-4">
          {footer}
        </div>
      )}
    </div>
  );
}
