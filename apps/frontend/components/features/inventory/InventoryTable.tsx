"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import type { InventoryProductDto } from "@repo/shared";
import { InventorySortField } from "@repo/shared";
import { cn } from "@/lib/cn";

type InventoryRow = InventoryProductDto & { id: string };

type SortDirection = "asc" | "desc";

interface InventoryTableProps {
  items: InventoryProductDto[];
  isLoading?: boolean;
  sortBy: InventorySortField;
  sortDir: SortDirection;
  onSort: (key: string, direction: SortDirection) => void;
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
  onSort,
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
        (page.pageNumber - 1) * page.pageSize + index + 1,
    },
    {
      key: InventorySortField.PRODUCT_NAME,
      title: "Product",
      sortable: true,
      render: (row) => (
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
      render: (row) => row.groupName ?? "—",
    },
    {
      key: "genericName",
      title: "Generic",
      render: (row) => row.genericName ?? "—",
    },
    {
      key: "shelfNo",
      title: "Shelf",
      align: "center",
      render: (row) => row.shelfNo ?? "—",
    },
    {
      key: InventorySortField.QUANTITY,
      title: "Qty",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="font-semibold">{row.totalQuantity}</span>
      ),
    },
    {
      key: InventorySortField.RETAIL_RATE,
      title: "Retail Rate",
      align: "right",
      sortable: true,
      render: (row) =>
        row.retailRate != null ? `PKR ${row.retailRate.toFixed(2)}/-` : "—",
    },
    {
      key: InventorySortField.EXPIRY_DATE,
      title: "Nearest Expiry",
      sortable: true,
      render: (row) =>
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
      render: (row) => row.batches.length,
    },
    {
      key: "status",
      title: "Status",
      render: (row) => {
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
      onSort={onSort}
      zebra
      footer={footer}
    />
  );
};
