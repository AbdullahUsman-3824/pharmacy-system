"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import type { InventoryProductDto } from "@repo/shared";
import { cn } from "@/lib/cn";

type InventoryRow = InventoryProductDto & { id: string };

type SortDirection = "asc" | "desc";
type SortableField =
  | "name"
  | "totalQuantity"
  | "nearestExpiryDate"
  | "retailRate";

interface InventoryTableProps {
  items: InventoryProductDto[];
  isLoading?: boolean;
  sortBy: SortableField;
  sortDir: SortDirection;
  onSortChange: (col: string) => void;
  footer?: React.ReactNode;
  page: { pageNumber: number; pageSize: number };
}

function getStatus(item: InventoryRow): {
  label: string;
  tone: "danger" | "warning" | "success";
} {
  if (item.isOutOfStock) return { label: "Out of Stock", tone: "danger" };
  if (item.isLowStock) return { label: "Low Stock", tone: "warning" };
  if (item.hasNearExpiryBatch) return { label: "Near Expiry", tone: "warning" };
  return { label: "In Stock", tone: "success" };
}

const toneClasses: Record<string, string> = {
  danger: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
};

export const InventoryTable = ({
  items,
  isLoading = false,
  sortBy,
  sortDir,
  onSortChange,
  footer,
  page,
}: InventoryTableProps) => {
  const router = useRouter();

  const rows: InventoryRow[] = useMemo(
    () => items.map((item) => ({ ...item, id: item.productId })),
    [items],
  );

  const columns: DataTableColumn<InventoryRow>[] = [
    {
      key: "index",
      title: "#",
      width: 30,
      render: (_row, index) =>
        (page?.pageNumber - 1) * page?.pageSize + index + 1,
    },
    {
      key: "name",
      title: "Product",
      sortable: true,
      render: (row: InventoryRow) => (
        <div>
          <span className="font-medium text-[var(--color-text)]">
            {row.name}
          </span>{" "}
          <span className="text-xs text-[var(--color-text-secondary)]">
            ({row.code})
          </span>
        </div>
      ),
    },
    {
      key: "groupName",
      title: "Group",
      render: (row: InventoryRow) => row.groupName ?? "—",
    },
    {
      key: "genericName",
      title: "Generic",
      render: (row: InventoryRow) => row.genericName ?? "—",
    },
    {
      key: "shelfNo",
      title: "Shelf",
      align: "center",
      render: (row: InventoryRow) => row.shelfNo ?? "—",
    },
    {
      key: "totalQuantity",
      title: "Qty",
      align: "right",
      sortable: true,
      render: (row: InventoryRow) => (
        <span className="font-semibold">{row.totalQuantity}</span>
      ),
    },
    {
      key: "retailRate",
      title: "Retail Rate",
      align: "right",
      sortable: true,
      render: (row: InventoryRow) =>
        row.retailRate != null ? `PKR ${row.retailRate.toFixed(2)}/-` : "—",
    },
    {
      key: "nearestExpiryDate",
      title: "Nearest Expiry",
      sortable: true,
      render: (row: InventoryRow) =>
        row.nearestExpiryDate
          ? new Date(row.nearestExpiryDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
    },
    {
      key: "batches",
      title: "Batches",
      align: "center",
      render: (row: InventoryRow) => row.batches.length,
    },
    {
      key: "status",
      title: "Status",
      render: (row: InventoryRow) => {
        const status = getStatus(row);
        return (
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-1 text-xs font-medium",
              toneClasses[status.tone],
            )}
          >
            {status.label}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable<InventoryRow>
      columns={columns}
      data={rows}
      rowKey={(row) => row.id}
      loading={isLoading}
      emptyTitle="No products found"
      emptyDescription="Try adjusting your search or filters."
      onRowClick={(row) => router.push(`/inventory/${row.productId}`)}
      sortKey={sortBy}
      sortDirection={sortDir}
      onSort={(key) => onSortChange(key)}
      zebra
      footer={footer}
    />
  );
};
