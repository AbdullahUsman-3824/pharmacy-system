"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  useSaleDetail,
  useReturnableItems,
  useCreateSale,
} from "@/hooks/useSale";
import {
  saleReturnFormSchema,
  SaleReturnFormInput,
  SaleReturnFormOutput,
} from "@/schemas/sale-return-form";
import { buildReturnPayload } from "./build-return-payload";
import { formatCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import LoadingState from "@/components/shared/loading-state";
import EmptyState from "@/components/shared/empty-state";

import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export default function SaleReturnPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const saleId = params.id;

  const [apiError, setApiError] = useState<string | null>(null);

  const {
    data: sale,
    isLoading: saleLoading,
    isError: saleNotFound,
  } = useSaleDetail(saleId);

  const { data: returnable, isLoading: returnableLoading } = useReturnableItems(
    sale?.id ?? "",
  );

  const createSale = useCreateSale();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaleReturnFormInput, unknown, SaleReturnFormOutput>({
    resolver: zodResolver(saleReturnFormSchema),
    defaultValues: {
      originalSaleId: "",
      customerName: "",
      remarks: "",
      discountPercent: 0,
      taxPercent: 0,
      lines: [],
    },
  });

  const { fields, replace } = useFieldArray({ control, name: "lines" });
  const watchedLines = useWatch({ control, name: "lines" });
  const discountPercent = (useWatch({ control, name: "discountPercent" }) ??
    0) as number;
  const taxPercent = (useWatch({ control, name: "taxPercent" }) ?? 0) as number;

  useEffect(() => {
    if (returnable && sale) {
      replace(
        returnable.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          batchId: item.batchId,
          batchNumber: item.batchNumber,
          saleRate: item.saleRate,
          looseRate: item.looseRate,
          maxPacks: item.availablePacksToReturn,
          maxLoose: item.availableLooseToReturn,
          packQuantity: 0,
          looseQuantity: 0,
        })),
      );
      reset((prev) => ({
        ...prev,
        originalSaleId: sale.id,
        customerName: sale.customerName,
      }));
    }
  }, [returnable, sale, replace, reset]);

  const totals = (() => {
    const gross = (watchedLines ?? []).reduce((sum, line) => {
      const packPart =
        (Number(line?.packQuantity) || 0) * (Number(line?.saleRate) || 0);
      const loosePart =
        (Number(line?.looseQuantity) || 0) * (Number(line?.looseRate) || 0);
      return sum + packPart + loosePart;
    }, 0);
    const discount = round2(gross * (discountPercent / 100));
    const taxable = gross - discount;
    const tax = round2(taxable * (taxPercent / 100));
    const net = round2(taxable + tax);
    return { gross, discount, tax, net };
  })();

  const onSubmit = async (data: SaleReturnFormOutput) => {
    setApiError(null);
    const hasAnyReturn = data.lines.some(
      (l) => l.packQuantity > 0 || l.looseQuantity > 0,
    );
    if (!hasAnyReturn) {
      setApiError("Enter a quantity for at least one item to return.");
      return;
    }

    const payload = buildReturnPayload(data);
    try {
      const result = await createSale.mutateAsync(payload);
      router.push(`/sales/${result.id}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setApiError(
        error?.message ?? "Failed to process return. Please try again.",
      );
    }
  };

  type LineField = (typeof fields)[number];

  const columns: DataTableColumn<LineField>[] = useMemo(
    () => [
      {
        key: "productName",
        dataKey: "productName",
        title: "Product",
        render: (row) => (
          <span className="font-medium text-[var(--color-text)]">
            {row.productName ?? "—"}
          </span>
        ),
      },
      {
        key: "batchNumber",
        dataKey: "batchNumber",
        title: "Batch",
        width: 110,
        align: "center",
        render: (row) => (
          <span className="font-mono text-xs text-[var(--color-text-secondary)]">
            {row.batchNumber}
          </span>
        ),
      },
      {
        key: "maxPacks",
        dataKey: "maxPacks",
        title: "Avail Packs",
        width: 100,
        align: "right",
      },
      {
        key: "returnPacks",
        title: "Return Packs",
        width: 120,
        align: "right",
        render: (row, index) => (
          <Input
            type="number"
            min={0}
            max={row.maxPacks}
            error={errors.lines?.[index]?.packQuantity?.message as string}
            className="text-right"
            {...register(`lines.${index}.packQuantity`)}
          />
        ),
      },
      {
        key: "maxLoose",
        dataKey: "maxLoose",
        title: "Avail Loose",
        width: 100,
        align: "right",
      },
      {
        key: "returnLoose",
        title: "Return Loose",
        width: 120,
        align: "right",
        render: (row, index) => (
          <Input
            type="number"
            min={0}
            max={row.maxLoose}
            error={errors.lines?.[index]?.looseQuantity?.message as string}
            className="text-right"
            {...register(`lines.${index}.looseQuantity`)}
          />
        ),
      },
    ],
    [errors.lines, register],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Process a Return"
        description="Select items to return for this sale."
      >
        <Button variant="secondary" onClick={() => router.push("/sales")}>
          Back
        </Button>
      </PageHeader>

      {saleLoading && <LoadingState />}

      {saleNotFound && (
        <div className="flex flex-col items-center gap-4">
          <EmptyState
            title="Sale not found"
            description="No sale found for the selected sale."
          />
          <Button variant="secondary" onClick={() => router.push("/sales")}>
            Back to sales
          </Button>
        </div>
      )}

      {sale && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <PageSection>
            <Card className="flex items-start justify-between gap-4">
              <div className="grid flex-1 grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-[var(--color-text-muted)]">
                    Sale Number
                  </span>
                  <p className="font-mono text-base font-medium text-[var(--color-text)]">
                    {sale.saleNumber}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">
                    Customer
                  </span>
                  <p className="text-base font-medium text-[var(--color-text)]">
                    {sale.customerName}
                  </p>
                </div>
              </div>
            </Card>
          </PageSection>

          {returnableLoading ? (
            <LoadingState />
          ) : (
            fields.length > 0 && (
              <>
                <PageSection>
                  <DataTable
                    columns={columns}
                    data={fields}
                    rowKey={(row) => row.id}
                    emptyTitle="No returnable items"
                  />
                </PageSection>

                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                          Discount %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-20 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                          {...register("discountPercent")}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                          Tax %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-20 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                          {...register("taxPercent")}
                        />
                      </div>
                    </div>
                  </div>

                  <Card className="w-full sm:w-72">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">
                          Gross
                        </span>
                        <span className="text-[var(--color-text-secondary)]">
                          {formatCurrency(totals.gross)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">
                          Discount
                        </span>
                        <span className="text-[var(--color-danger-text)]">
                          -{formatCurrency(totals.discount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">
                          Tax
                        </span>
                        <span className="text-[var(--color-text-secondary)]">
                          {formatCurrency(totals.tax)}
                        </span>
                      </div>
                      <div className="mt-2 border-t border-[var(--color-border)] pt-2">
                        <div className="flex justify-between text-base font-bold">
                          <span className="text-[var(--color-text)]">
                            Net Refund
                          </span>
                          <span className="text-[var(--color-primary)]">
                            {formatCurrency(totals.net)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {apiError && (
                  <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-4">
                    <p className="text-sm text-[var(--color-danger-text)]">
                      {apiError}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={createSale.isPending}
                  className="w-full"
                >
                  {createSale.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Process Return"
                  )}
                </Button>
              </>
            )
          )}
        </form>
      )}
    </PageContainer>
  );
}
