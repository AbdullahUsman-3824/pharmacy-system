// app/sale/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSales } from "@/hooks/useSale";
import { SaleType } from "@repo/shared";
import { formatCurrency, formatDate } from "@/lib/format";

const PAGE_SIZE = 20;

function TypeBadge({ type }: { type: SaleType }) {
  const isReturn = type === SaleType.SALE_RETURN;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
        isReturn
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-green-50 text-green-700 border-green-200"
      }`}
    >
      {isReturn ? "Return" : "Sale"}
    </span>
  );
}

export default function SalesListPage() {
  const [page, setPage] = useState(1);
  // const [searchQuery, setSearchQuery] = useState("");
  const skip = (page - 1) * PAGE_SIZE;

  const { data, isLoading, isError } = useSales({ skip, take: PAGE_SIZE });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="max-w-7xl mx-auto w-full py-6 px-4">
      {/* Back Navigation - Optional, only if coming from somewhere */}
      {/* <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link> */}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all sales transactions
          </p>
        </div>
        <Link
          href="/sale/return"
          className="rounded-lg bg-blue-900 hover:bg-blue-900/90 text-white px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap self-start sm:self-center"
        >
          Process Return
        </Link>
      </div>

      {/* Search - Optional, add when API supports */}
      {/* <div className="mb-4">
        <input
          type="text"
          placeholder="Search by sale number or customer..."
          className="w-full sm:w-80 rounded-xl border border-border px-4 py-2 text-sm bg-surface-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div> */}

      {/* Table with new styling */}
      <div className="mt-4 flex-1 rounded-xl border border-border bg-surface-card p-5 shadow-panel">
        <div className="grid grid-cols-[1fr_140px_1fr_100px_140px] border-b border-border-soft pb-2 text-sm text-ink-500">
          <span>Sale #</span>
          <span>Date</span>
          <span>Customer</span>
          <span className="text-center">Type</span>
          <span className="text-right">Net Amount</span>
        </div>

        <div className="divide-y divide-border-soft">
          {isLoading && (
            <div className="py-12 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading sales...
              </p>
            </div>
          )}
          {isError && (
            <div className="py-12 text-center text-destructive">
              <div className="text-4xl mb-2">⚠️</div>
              <p className="font-medium">Failed to load sales</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try again later
              </p>
            </div>
          )}
          {data?.data.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="font-medium">No sales yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start by creating your first sale
              </p>
            </div>
          )}
          {data?.data.map((sale) => (
            <div
              key={sale.id}
              className="grid grid-cols-[1fr_140px_1fr_100px_140px] items-center py-3 px-3 text-sm hover:bg-gray-100/90 transition-colors group cursor-pointer"
              onClick={() => {
                window.location.href = `/sale/${sale.id}`;
              }}
            >
              <span className="font-mono text-xs font-medium text-ink-900">
                {sale.saleNumber}
              </span>
              <span className="text-ink-700">{formatDate(sale.date)}</span>
              <span className="font-medium text-ink-900">
                {sale.customerName}
              </span>
              <div className="text-center">
                <TypeBadge type={sale.type} />
              </div>
              <span className="text-right font-semibold text-ink-900">
                {formatCurrency(sale.netAmount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {data && data.total > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 text-sm">
          <span className="text-muted-foreground order-2 sm:order-1">
            Page {page} of {totalPages} — {data.total} total
          </span>
          <div className="flex gap-2 order-1 sm:order-2">
            <button
              className="rounded-xl border border-border px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="rounded-xl border border-border px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
