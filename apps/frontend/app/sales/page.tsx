"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { SaleType } from "@repo/shared";

import { useSales } from "@/hooks/useSale";
import { formatCurrency, formatDate } from "@/lib/format";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { SearchBar } from "@/components/ui/searchBar";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

const PAGE_SIZE = 20;

type SaleRow = {
  id: string;
  saleNumber: string;
  date: string | Date;
  customerName: string;
  type: SaleType;
  netAmount: number;
};

export default function SalesListPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const skip = (page - 1) * PAGE_SIZE;
  
  const [searchInput, setSearchInput] = useState("");
  const isSearchMode = searchInput.trim().length >= 2;

  const { data, isLoading, isFetching, isError } = useSales({
    skip,
    take: PAGE_SIZE,
    search: isSearchMode ? searchInput.trim() : undefined,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const goToReturn = useCallback(
    (saleId: string) => router.push(`/sales/${saleId}/return`),
    [router],
  );

  const tableData: SaleRow[] = (data?.data ?? []) as SaleRow[];

  const tableLoading = isLoading || isFetching;

  const emptyTitle = isSearchMode
    ? "No matching sales found"
    : "No sales found";

  const columns: DataTableColumn<SaleRow>[] = useMemo(
    () => [
      {
        key: "saleNumber",
        dataKey: "saleNumber",
        title: "Sale #",
        width: 220,
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
        render: (row) => formatDate(row.date as string),
      },
      {
        key: "customerName",
        dataKey: "customerName",
        title: "Customer",
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
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search by sale number or customer..."
          count={data?.total}
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
            data={tableData}
            loading={tableLoading}
            emptyTitle={emptyTitle}
            emptyDescription={
              isSearchMode
                ? "Try a different sale number or customer name."
                : "Sales will appear here after the first transaction."
            }
            zebra
            stickyHeader
            onRowClick={(row) => router.push(`/sales/${row.id}`)}
            footer={
              data && data.total > PAGE_SIZE ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Page {page} of {totalPages} • {data.total} total sales
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={page === totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null
            }
          />
        )}
      </PageSection>
    </PageContainer>
  );
}
