"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSaleDetail } from "@/hooks/useSale";
import { SaleType } from "@repo/shared";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: sale, isLoading, isError } = useSaleDetail(params.id);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Loading sale details...
        </p>
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-destructive">
          Sale not found
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          The sale you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Link
          href="/sale"
          className="inline-block mt-4 text-primary hover:underline text-sm"
        >
          ← Back to sales
        </Link>
      </div>
    );
  }

  const isReturn = sale.type === SaleType.SALE_RETURN;

  return (
    <div className="max-w-5xl mx-auto w-full py-6 px-4">
      {/* Back Navigation */}
      <Link
        href="/sale"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Sales
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {isReturn ? "Sale Return" : "Sale"}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                isReturn
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-green-50 text-green-700 border-green-200"
              }`}
            >
              {isReturn ? "Return" : "Sale"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 space-x-2">
            <span className="font-mono font-medium">{sale.saleNumber}</span>
            <span>·</span>
            <span>{formatDate(sale.date)}</span>
            <span>·</span>
            <span>{sale.customerName}</span>
          </p>
          {isReturn && sale.originalSaleId && (
            <Link
              href={`/sale/${sale.originalSaleId}`}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
            >
              ← View original sale
            </Link>
          )}
        </div>

        {!isReturn && (
          <Link
            href={`/sale/return?saleId=${encodeURIComponent(sale.id)}`}
            className="rounded-lg bg-blue-800 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap self-start sm:self-center"
          >
            Return items
          </Link>
        )}
      </div>

      {/* Items Table with new styling */}
      <div className="mt-4 flex-1 rounded-xl border border-border bg-surface-card p-5 shadow-panel">
        <div className="grid grid-cols-[1fr_80px_100px_100px_100px_100px] border-b border-border-soft pb-2 text-sm text-ink-500">
          <span>Product</span>
          <span className="text-center">Batch</span>
          <span className="text-right">Packs</span>
          <span className="text-right">Loose</span>
          <span className="text-right">Rate</span>
          <span className="text-right">Amount</span>
        </div>

        <div className="divide-y divide-border-soft">
          {sale.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_80px_100px_100px_100px_100px] items-center py-3 text-sm"
            >
              <span className="font-medium text-ink-900">
                {item.productName ?? "—"}
              </span>
              <span className="text-center font-mono text-xs text-ink-700">
                {item.batch.batchNumber}
              </span>
              <span className="text-right text-ink-700">
                {item.packQuantity}
              </span>
              <span className="text-right text-ink-700">
                {item.looseQuantity}
              </span>
              <span className="text-right text-ink-700">
                {formatCurrency(item.saleRate)}
              </span>
              <span className="text-right font-medium text-ink-900">
                {formatCurrency(item.netAmount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-6 mt-6">
        <div className="flex-1">
          {sale.remarks && (
            <div className="rounded-xl border border-border bg-surface-card p-5 shadow-panel">
              <p className="text-sm">
                <span className="font-medium text-ink-500">Remarks:</span>{" "}
                {sale.remarks}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface-card p-5 w-full sm:w-80 shadow-panel">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Gross</span>
              <span className="text-ink-700">
                {formatCurrency(sale.grossAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">
                Discount{" "}
                {sale.discountPercent ? `(${sale.discountPercent}%)` : ""}
              </span>
              <span className="text-red-600">
                -{formatCurrency(sale.discountAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">
                Tax {sale.taxPercent ? `(${sale.taxPercent}%)` : ""}
              </span>
              <span className="text-ink-700">
                {formatCurrency(sale.taxAmount)}
              </span>
            </div>
            <div className="border-t border-border-soft pt-2 mt-2">
              <div className="flex justify-between font-bold text-base">
                <span className="text-ink-900">Net Total</span>
                <span className="text-primary">
                  {formatCurrency(sale.netAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
