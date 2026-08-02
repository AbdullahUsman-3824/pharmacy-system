"use client";

import { useRouter } from "next/navigation";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { VoucherTypeBadge } from "../shared/VoucherTypeBadge";
import type { StockVoucherListItem } from "@repo/shared";

type SortDirection = "asc" | "desc";

interface StockVouchersTableProps {
  vouchers: StockVoucherListItem[];
  isLoading?: boolean;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
}

export const StockVouchersTable = ({
  vouchers,
  isLoading = false,
  sortKey,
  sortDirection,
  onSort,
}: StockVouchersTableProps) => {
  const router = useRouter();

  const columns: DataTableColumn<StockVoucherListItem>[] = [
    {
      key: "voucherNumber",
      dataKey: "voucherNumber",
      title: "Voucher #",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-[var(--color-text)]">
          #{row.voucherNumber}
        </span>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (row) => <VoucherTypeBadge type={row.type} />,
    },
    {
      key: "date",
      dataKey: "date",
      title: "Date",
      sortable: true,
      render: (row) =>
        new Date(row.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      key: "supplier",
      title: "Supplier",
      // Only PURCHASE / PURCHASE_RETURN have a supplier; ADJUSTMENT will be "—".
      render: (row) => row.supplierName ?? "—",
    },
    {
      key: "items",
      title: "Items",
      align: "center",
      render: (row) => row.itemCount,
    },
    {
      key: "netAmount",
      dataKey: "netAmount",
      title: "Amount",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[var(--color-text)]">
          PKR {row.netAmount.toFixed(2)}/-
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      align: "right",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/stock/${row.id}`);
          }}
          className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          View →
        </button>
      ),
    },
  ];

  return (
    <DataTable<StockVoucherListItem>
      columns={columns}
      data={vouchers}
      loading={isLoading}
      emptyTitle="No vouchers found"
      emptyDescription="Create your first purchase voucher to get started."
      onRowClick={(row) => router.push(`/stock/${row.id}`)}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={onSort}
      zebra
    />
  );
};
