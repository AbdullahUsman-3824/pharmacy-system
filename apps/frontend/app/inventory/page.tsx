"use client";

import { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import {
  InventoryFilters,
  type InventoryFilterState,
} from "@/components/features/stock/inventory/InventoryFilters";
import { InventoryTable } from "@/components/features/stock/inventory/InventoryTable";
import type { InventoryListQuery } from "@repo/shared";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

export default function InventoryPage() {
  const [filters, setFilters] = useState<InventoryFilterState>({
    search: "",
    lowStockOnly: false,
    nearExpiryOnly: false,
  });
  const [sortBy, setSortBy] = useState<InventoryListQuery["sortBy"]>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isFetching } = useInventory({
    ...filters,
    sortBy,
    sortDir,
    page,
    pageSize,
  });

  const handleSortChange = (col: string) => {
    if (col === sortBy) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col as InventoryListQuery["sortBy"]);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleFiltersChange = (next: InventoryFilterState) => {
    setFilters(next);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <PageContainer>
      <PageHeader
        title="Inventory"
        description="Current stock across all products and batches."
      >
        {/* Not functional yet — export/print for stock-taking, see next task */}
        <Button variant="outline" disabled title="Coming soon">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </PageHeader>

      <PageSection>
        <div className="mb-4">
          <InventoryFilters
            value={filters}
            onChange={handleFiltersChange}
            resultCount={data?.total}
          />
        </div>

        <InventoryTable
          items={data?.items ?? []}
          isLoading={isLoading}
          sortBy={sortBy ?? "name"}
          sortDir={sortDir}
          onSortChange={handleSortChange}
        />

        {/* Filtered-set summary — reflects ALL matching rows, not just the
            current page, since data.totalQuantitySum / totalStockValue are
            computed server-side before pagination. */}
        {data && (
          <div className="mt-3 text-sm text-[var(--color-text-secondary)]">
            {data.total} products · Total Qty:{" "}
            <span className="font-medium text-[var(--color-text)]">
              {data.totalQuantitySum.toLocaleString()}
            </span>{" "}
            · Stock Value:{" "}
            <span className="font-medium text-[var(--color-text)]">
              PKR {data.totalStockValue.toFixed(2)}/-
            </span>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-[var(--color-text-secondary)]">
              Page {page} of {totalPages}
              {isFetching && !isLoading && " · updating..."}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center justify-center h-8 w-8 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-row-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[var(--color-text)] px-3">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center justify-center h-8 w-8 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-row-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}
