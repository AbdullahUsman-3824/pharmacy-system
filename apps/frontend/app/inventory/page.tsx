"use client";

import { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import {
  InventoryFilters,
  type InventoryFilterState,
} from "@/components/features/inventory/InventoryFilters";
import { InventoryTable } from "@/components/features/inventory/InventoryTable";
import type { InventoryListQuery } from "@repo/shared";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
import { Download } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 25;

export default function InventoryPage() {
  const [filters, setFilters] = useState<InventoryFilterState>({
    search: "",
    lowStockOnly: false,
    outOfStockOnly: false,
    nearExpiryOnly: false,
  });
  const [sortBy, setSortBy] = useState<InventoryListQuery["sortBy"]>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useInventory({
    ...filters,
    sortBy,
    sortDir,
    page,
    pageSize: PAGE_SIZE,
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

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Inventory"
        description="Current stock across all products and batches."
      >
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
          page={{ pageNumber: page, pageSize: PAGE_SIZE }}
          footer={
            totalPages > 0 ? (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                itemsPerPage={PAGE_SIZE}
                totalItems={data?.total ?? 0}
              />
            ) : null
          }
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
              PKR {data.totalStockValue.toLocaleString()}
              /-
            </span>
            {isFetching && !isLoading && (
              <span className="ml-2">· updating...</span>
            )}
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}
