"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSaleDetail } from "@/hooks/useSale";
import { SaleType } from "@repo/shared";
import { formatCurrency, formatDate } from "@/lib/format";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";

import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import LoadingState from "@/components/shared/loading-state";
import EmptyState from "@/components/shared/empty-state";

import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

type SaleItem = ReturnType<typeof useSaleDetail>["data"] extends
  | { items: (infer I)[] }
  | undefined
  ? I
  : never;

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: sale, isLoading, isError } = useSaleDetail(params.id);

  const columns: DataTableColumn<SaleItem>[] = useMemo(
    () => [
      {
        key: "productName",
        title: "Product",
        render: (row) => (
          <span className="font-medium text-[var(--color-text)]">
            {row.product?.name ?? "—"}
          </span>
        ),
      },
      {
        key: "batch",
        title: "Batch",
        width: 100,
        align: "center",
        render: (row) => {
          const isAuto = row.batch.batchNumber.includes("AUTO");
          return (
            <div>
              <span className="font-mono text-xs">
                {isAuto ? "N/A" : row.batch.batchNumber}
              </span>
            </div>
          );
        },
      },
      {
        key: "packQuantity",
        dataKey: "packQuantity",
        title: "Packs",
        width: 90,
        align: "right",
      },
      {
        key: "looseQuantity",
        dataKey: "looseQuantity",
        title: "Loose",
        width: 90,
        align: "right",
      },
      {
        key: "saleRate",
        dataKey: "saleRate",
        title: "Rate",
        width: 100,
        align: "right",
        render: (row) => formatCurrency(row.saleRate),
      },
      {
        key: "netAmount",
        dataKey: "netAmount",
        title: "Amount",
        width: 110,
        align: "right",
        render: (row) => (
          <span className="font-medium text-[var(--color-text)]">
            {formatCurrency(row.netAmount)}
          </span>
        ),
      },
    ],
    [],
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !sale) {
    return (
      <EmptyState
        title="Sale not found"
        description="The requested sale could not be loaded."
      />
    );
  }

  const isReturn = sale.type === SaleType.SALE_RETURN;

  return (
    <PageContainer>
      <PageHeader
        title={isReturn ? "Sale Return" : "Sale"}
        description={`${sale.saleNumber} • ${formatDate(sale.date)} • ${sale.customer}`}
      >
        <Button variant="secondary" onClick={() => router.push("/sales")}>
          Back
        </Button>

        {!isReturn && (
          <Button
            onClick={() => router.push(`/sales/return?saleId=${sale.id}`)}
          >
            Return Items
          </Button>
        )}
      </PageHeader>

      <PageSection>
        <DataTable
          columns={columns}
          data={sale.items}
          emptyTitle="No items"
          emptyDescription="This sale has no line items."
        />
      </PageSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {sale.remarks ? (
          <Card className="lg:col-span-2">
            <h3 className="mb-4 text-base font-semibold text-[var(--color-text)]">
              Remarks
            </h3>

            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              {sale.remarks}
            </p>
          </Card>
        ) : (
          <div className="lg:col-span-2" />
        )}

        <Card>
          <h3 className="mb-4 text-base font-semibold text-[var(--color-text)]">
            Summary
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">
                Gross Amount
              </span>

              <span className="font-medium">
                {formatCurrency(sale.grossAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">
                Discount
                {sale.discountPercent ? ` (${sale.discountPercent}%)` : ""}
              </span>

              <span className="font-medium text-[var(--color-danger-text)]">
                -{formatCurrency(sale.discountAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">
                Tax
                {sale.taxPercent ? ` (${sale.taxPercent}%)` : ""}
              </span>

              <span className="font-medium">
                {formatCurrency(sale.taxAmount)}
              </span>
            </div>

            <div className="border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Net Total</span>

                <span className="text-lg font-bold text-[var(--color-primary)]">
                  {formatCurrency(sale.netAmount)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
