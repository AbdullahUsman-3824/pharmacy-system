"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SaleType } from "@repo/shared";

import { useSales } from "@/hooks/useSale";
import { formatCurrency, formatDate } from "@/lib/format";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";

import { DataTable, DataTableColumn } from "@/components/shared/data-table";

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

  const { data, isLoading, isError } = useSales({
    skip,
    take: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

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
    ],
    [],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Sales"
        description="View and manage completed sales transactions."
      >
        <Link href="/sales/return">
          <Button>Process Return</Button>
        </Link>
      </PageHeader>

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
            data={(data?.data ?? []) as SaleRow[]}
            loading={isLoading}
            emptyTitle="No sales found"
            emptyDescription="Sales will appear here after the first transaction."
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
