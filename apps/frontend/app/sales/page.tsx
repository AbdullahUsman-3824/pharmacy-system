"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { SaleType, SaleSortField, SaleDto } from "@repo/shared";

import { useSales } from "@/hooks/useSale";
import { formatCurrency, formatDate } from "@/lib/format";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchBar } from "@/components/ui/searchBar";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

const PAGE_SIZE = 20;

type SortDirection = "asc" | "desc";

type SaleRow = Pick<
  SaleDto,
  "id" | "saleNumber" | "date" | "type" | "netAmount" | "customer"
>;

export default function SalesListPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data, isLoading, isFetching, isError } = useSales({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    sortBy: sortKey as SaleSortField,
    sortOrder: sortDirection,
  });

  const sales = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  const goToReturn = useCallback(
    (saleId: string) => router.push(`/sales/${saleId}/return`),
    [router],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(key);
    setSortDirection(direction);
    setPage(1);
  };

  const tableLoading = isLoading || isFetching;
  const isSearchMode = search.trim().length > 0;

  const columns: DataTableColumn<SaleRow>[] = useMemo(
    () => [
      {
        key: "saleNumber",
        dataKey: "saleNumber",
        title: "Sale #",
        width: 220,
        sortable: true,
        render: (row) => (
          <span className="font-mono text-xs font-semibold">
            {row.saleNumber}
          </span>
        ),
      },
      {
        key: "date",
        dataKey: "date",
        title: "Date",
        width: 150,
        sortable: true,
        render: (row) => formatDate(row.date as string),
      },
      {
        key: "customer",
        dataKey: "customer",
        title: "Customer",
        sortable: true,
        render: (row) => row.customer ?? "—",
      },
      {
        key: "type",
        dataKey: "type",
        title: "Type",
        width: 130,
        align: "center",
        render: (row) => (
          <Badge
            rounded
            variant={row.type === SaleType.SALE_RETURN ? "danger" : "success"}
          >
            {row.type === SaleType.SALE_RETURN ? "Return" : "Sale"}
          </Badge>
        ),
      },
      {
        key: "netAmount",
        dataKey: "netAmount",
        title: "Net Amount",
        width: 160,
        align: "right",
        sortable: true,
        render: (row) => (
          <span className="font-semibold">{formatCurrency(row.netAmount)}</span>
        ),
      },
      {
        key: "actions",
        title: "",
        width: 110,
        align: "right",
        render: (row) =>
          row.type === SaleType.SALE ? (
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                goToReturn(row.id);
              }}
            >
              Return
            </Button>
          ) : null,
      },
    ],
    [goToReturn],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Sales"
        description="View and manage completed sales transactions."
      />

      <PageSection>
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by sale number or customer..."
          count={meta?.total ?? 0}
          entityLabelPlural="sales"
        />
      </PageSection>

      <PageSection>
        {isError ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-6 text-center">
            <p className="font-semibold text-[var(--color-danger-text)]">
              Failed to load sales.
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Please try again later.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={sales}
            loading={tableLoading}
            emptyTitle={
              isSearchMode ? "No matching sales found" : "No sales found"
            }
            emptyDescription={
              isSearchMode
                ? "Try a different sale number or customer name."
                : "Sales will appear here after the first transaction."
            }
            zebra
            stickyHeader
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            onRowClick={(row) => router.push(`/sales/${row.id}`)}
            footer={
              meta && meta.totalPages > 0 ? (
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                  itemsPerPage={meta.pageSize}
                  totalItems={meta.total}
                />
              ) : null
            }
          />
        )}
      </PageSection>
    </PageContainer>
  );
}
