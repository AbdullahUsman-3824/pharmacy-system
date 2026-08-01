"use client";

import { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import {
  InventoryFilters,
  type InventoryFilterState,
} from "@/components/stock/inventory/InventoryFilters";
import { InventoryTable } from "@/components/stock/inventory/InventoryTable";
import type { InventoryListQuery } from "@repo/shared";

export default function StockListPage() {
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
    <>
      <InventoryFilters value={filters} onChange={handleFiltersChange} />

      {isLoading ? (
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      ) : (
        <>
          <InventoryTable
            items={data?.items ?? []}
            sortBy={sortBy ?? "name"}
            sortDir={sortDir}
            onSortChange={handleSortChange}
          />

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">
              {data?.total ?? 0} products {isFetching && "(updating...)"}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {page} of {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
