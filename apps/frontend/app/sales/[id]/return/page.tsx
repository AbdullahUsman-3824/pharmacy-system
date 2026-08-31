"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { usePinModal } from "@/hooks/usePinModal";
import type { PaymentOption } from "@/components/shared/payment-select";
import { toast } from "sonner";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import LoadingState from "@/components/shared/loading-state";
import EmptyState from "@/components/shared/empty-state";
import { usePageShortcuts } from "@/lib/shortcuts/usePageShortcuts";

import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

import {
  SalePayment,
  SalePaymentRef,
} from "@/components/features/sale/pos/items/SalePayment";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export default function SaleReturnPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const saleId = params.id;

  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentOption | null>(
    null,
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const paymentRef = useRef<SalePaymentRef>(null);

  const {
    data: sale,
    isLoading: saleLoading,
    isError: saleNotFound,
  } = useSaleDetail(saleId);

  const { data: returnable, isLoading: returnableLoading } = useReturnableItems(
    sale?.id ?? "",
  );

  const createSale = useCreateSale();
  const { getPin, PinModalElement } = usePinModal();

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
      customerId: null,
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
          packingSize: item.packingSize,
          maxPacks: item.availablePacksToReturn,
          maxLoose: item.availableLooseToReturn,
          maxUnits: item.availableUnitsToReturn,
          packQuantity: 0,
          looseQuantity: 0,
        })),
      );

      reset((prev) => ({
        ...prev,
        originalSaleId: sale.id,
        customerId: sale.customerId ?? null,
        customerName: sale.customerName ?? "",
      }));
    }
  }, [returnable, sale, replace, reset]);

  const totals = useMemo(() => {
    const gross = (watchedLines ?? []).reduce((sum, line) => {
      const packingSize = Number(line?.packingSize) || 1;
      const unitQty =
        (Number(line?.packQuantity) || 0) * packingSize +
        (Number(line?.looseQuantity) || 0);
      return sum + unitQty * (Number(line?.saleRate) || 0);
    }, 0);

    const discount = round2(gross * (discountPercent / 100));
    const taxable = gross - discount;
    const tax = round2(taxable * (taxPercent / 100));
    const net = round2(taxable + tax);

    return { gross, discount, tax, net };
  }, [watchedLines, discountPercent, taxPercent]);

  usePageShortcuts([
    {
      id: "complete-return",
      shortcut: "F11",
      description: "Process Return",
      priority: 300,
      execute: () => paymentRef.current?.complete(),
    },
  ]);

  const processReturn = async (data: SaleReturnFormOutput) => {
    setApiError(null);
    setPaymentError(null);

    const hasAnyReturn = data.lines.some(
      (l) => l.packQuantity > 0 || l.looseQuantity > 0,
    );
    if (!hasAnyReturn) {
      setApiError("Enter a quantity for at least one item to return.");
      return;
    }

    if (!selectedPayment) {
      const msg = "Please select a refund method.";
      setPaymentError(msg);
      toast.error(msg);
      return;
    }

    try {
      const pin = await getPin("salesman");
      if (!pin) {
        toast.error("PIN verification cancelled or failed.");
        return;
      }

      const payload = buildReturnPayload(data, selectedPayment.id, pin);
      const result = await createSale.mutateAsync(payload);

      toast.success("Return processed successfully!");
      router.push(`/sales/${result.id}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to process return. Please try again.";

      setApiError(message);
      toast.error(message);
    }
  };

  const onSubmit = (data: SaleReturnFormOutput) => {
    processReturn(data);
  };

  const handleCompleteReturn = () => {
    handleSubmit(onSubmit)();
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
            max={Math.floor(row.maxUnits / row.packingSize)}
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
            max={row.maxUnits}
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left side - Items + Discount/Tax */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <PageSection>
              <Card>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-[var(--color-text-muted)]">
                      Sale Number
                    </span>
                    <p className="font-mono text-base font-medium">
                      {sale.saleNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)]">
                      Customer
                    </span>
                    <p className="text-base font-medium">
                      {sale.customerName ?? "Walk-in"}
                    </p>
                  </div>
                </div>
              </Card>
            </PageSection>

            {returnableLoading ? (
              <LoadingState />
            ) : fields.length > 0 ? (
              <>
                <PageSection>
                  <DataTable
                    columns={columns}
                    data={fields}
                    rowKey={(row) => row.id}
                    emptyTitle="No returnable items"
                  />
                </PageSection>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Discount %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20 rounded border px-3 py-1.5 text-sm"
                      {...register("discountPercent")}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Tax %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20 rounded border px-3 py-1.5 text-sm"
                      {...register("taxPercent")}
                    />
                  </div>
                </div>

                {apiError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-600">{apiError}</p>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No returnable items"
                description="All items from this sale have already been returned."
              />
            )}
          </div>

          {/* Right side - Summary + Payment */}
          <div className="flex flex-col gap-4">
            <Card>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gross</span>
                  <span>{formatCurrency(totals.gross)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-red-600">
                    -{formatCurrency(totals.discount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="mt-2 border-t pt-2">
                  <div className="flex justify-between text-base font-bold">
                    <span>Net Refund</span>
                    <span className="text-blue-600">
                      {formatCurrency(totals.net)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <SalePayment
              ref={paymentRef}
              netAmount={totals.net}
              saleCompleted={false}
              selectedPayment={selectedPayment}
              onPaymentChange={setSelectedPayment}
              onComplete={handleCompleteReturn}
              paymentError={paymentError}
            />
          </div>
        </div>
      )}

      {PinModalElement}
    </PageContainer>
  );
}
