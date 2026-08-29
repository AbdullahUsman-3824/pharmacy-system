"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useStockVoucher } from "@/hooks/useStock";
import { VoucherTypeBadge } from "@/components/features/stock/shared/VoucherTypeBadge";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
import {
  ArrowLeft,
  Printer,
  Download,
  Loader2,
  Package,
  // Calendar,
  Hash,
  Building2,
  FileText,
  AlertCircle,
  Coins,
} from "lucide-react";

import type { StockVoucherItemOutput } from "@repo/shared";

type VoucherItemRow = StockVoucherItemOutput;

export default function ViewVoucherPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: voucher, isLoading, error } = useStockVoucher(id as string);
  const [isPrinting, setIsPrinting] = useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[var(--color-text-secondary)] animate-spin" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-3">
            Loading voucher...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (error || !voucher) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-danger)]" />
          <h2 className="text-lg font-semibold text-[var(--color-text)] mt-3">
            Voucher Not Found
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-md">
            The voucher you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => router.push("/stock")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vouchers
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setIsPrinting(false);
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(voucher, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute(
      "download",
      `voucher-${voucher.voucherNumber}.json`,
    );
    linkElement.click();
  };

  const itemColumns: DataTableColumn<VoucherItemRow>[] = [
    {
      key: "product",
      title: "Product",
      render: (row: VoucherItemRow) => (
        <div>
          <span className="font-medium text-[var(--color-text)]">
            {row.product.name}
          </span>{" "}
          <span className="text-xs text-[var(--color-text-secondary)]">
            ({row.product.code})
          </span>
        </div>
      ),
    },
    {
      key: "batch",
      title: "Batch",
      render: (row: VoucherItemRow) => {
        const isAuto = row.batch.batchNumber.includes("AUTO");
        return (
          <div>
            <span className="font-mono text-xs">
              {isAuto ? "N/A" : row.batch.batchNumber}
            </span>
            {row.batch.expiryDate && (
              <span className="text-xs text-[var(--color-text-secondary)] ml-2">
                Exp: {new Date(row.batch.expiryDate).toLocaleDateString()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "packQuantity",
      title: "Pack",
      align: "right",
      render: (row: VoucherItemRow) => (
        <span className="font-semibold">{row.packQuantity}</span>
      ),
    },
    {
      key: "looseQuantity",
      title: "Loose",
      align: "right",
      render: (row: VoucherItemRow) => (
        <span className="font-semibold">
          {row.looseQuantity}
          {row.freeQuantity > 0 && (
            <span className="text-xs text-[var(--color-success)] font-normal ml-1">
              (+{row.freeQuantity} free)
            </span>
          )}
        </span>
      ),
    },
    {
      key: "purchaseRate",
      title: "Rate",
      align: "right",
      render: (row: VoucherItemRow) => `PKR ${row.purchaseRate.toFixed(2)}/-`,
    },
    {
      key: "netAmount",
      title: "Amount",
      align: "right",
      render: (row: VoucherItemRow) => (
        <span className="font-semibold text-[var(--color-text)]">
          PKR {row.netAmount.toFixed(2)}/-
        </span>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={`Voucher #${voucher.voucherNumber}`}
        description={`Created ${new Date(voucher.createdAt).toLocaleString()}`}
      >
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="ghost" onClick={() => router.push("/stock")}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </PageHeader>

      <PageSection>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)] overflow-hidden">
          {/* Meta details */}
          <div className="px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-background)] ">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetaField
                icon={<Hash className="w-4 h-4" />}
                label="Voucher Type"
              >
                <VoucherTypeBadge type={voucher.type} />
              </MetaField>

              {/* <MetaField icon={<Calendar className="w-4 h-4" />} label="Date">
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  {new Date(voucher.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </MetaField> */}

              {voucher.supplier && (
                <MetaField
                  icon={<Building2 className="w-4 h-4" />}
                  label="Supplier"
                >
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    {voucher.supplier}
                  </span>
                </MetaField>
              )}

              {voucher.remarks && (
                <MetaField
                  icon={<FileText className="w-4 h-4" />}
                  label="Remarks"
                >
                  <span className="text-sm text-[var(--color-text)]">
                    {voucher.remarks}
                  </span>
                </MetaField>
              )}
              <MetaField
                icon={<Coins className="w-4 h-4" />}
                label="Total Amount"
              >
                <span className="text-md font-bold text-[var(--color-primary)]">
                  PKR {voucher.netAmount.toFixed(2)}/-
                </span>
              </MetaField>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <h2 className="font-semibold text-[var(--color-text)]">Items</h2>
              <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-background-muted)] px-2 py-0.5 rounded-full">
                {voucher.items?.length || 0} items
              </span>
            </div>

            <DataTable<VoucherItemRow>
              columns={itemColumns}
              data={voucher.items ?? []}
              emptyTitle="No items in this voucher"
            />
          </div>

          {/* Totals */}
          <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-background)]">
            <div className="flex flex-col items-end space-y-1">
              <TotalRow label="Gross Amount" value={voucher.grossAmount} />
              {voucher.discountAmount > 0 && (
                <TotalRow
                  label="Discount"
                  value={-voucher.discountAmount}
                  negative
                />
              )}
              {voucher.taxAmount > 0 && (
                <TotalRow label="Tax" value={voucher.taxAmount} positive />
              )}
              <div className="flex items-center gap-6 text-base pt-1 border-t border-[var(--color-border)] w-full justify-end">
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  Net Amount:
                </span>
                <span className="font-bold text-[var(--color-text)] text-lg">
                  PKR {voucher.netAmount.toFixed(2)}/-
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}

function MetaField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-[var(--color-background-muted)] rounded-[var(--radius-md)] text-[var(--color-text-secondary)]">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          {label}
        </p>
        <div className="pt-1">{children}</div>
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  negative,
  positive,
}: {
  label: string;
  value: number;
  negative?: boolean;
  positive?: boolean;
}) {
  const sign = negative ? "-" : positive ? "+" : "";
  const colorClass = negative
    ? "text-[var(--color-danger)]"
    : "text-[var(--color-text)]";
  return (
    <div className="flex items-center gap-6 text-sm">
      <span className="text-[var(--color-text-secondary)]">{label}:</span>
      <span className={`font-medium ${colorClass}`}>
        {sign}PKR {Math.abs(value).toFixed(2)}/-
      </span>
    </div>
  );
}
