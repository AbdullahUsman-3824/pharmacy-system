"use client";

import { useMemo, useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import {
  InventoryFilters,
  type InventoryFilterState,
} from "@/components/features/inventory/InventoryFilters";
import { InventoryTable } from "@/components/features/inventory/InventoryTable";
import { InventorySortField } from "@repo/shared";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
import { Download } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 25;

type SortDirection = "asc" | "desc";

export default function InventoryPage() {
  const [filters, setFilters] = useState<InventoryFilterState>({
    search: "",
    status: undefined,
  });
  const [sortBy, setSortBy] = useState<InventorySortField>(
    InventorySortField.PRODUCT_NAME,
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useInventory({
    page,
    pageSize: PAGE_SIZE,
    search: filters.search || undefined,
    sortBy,
    sortOrder,
    status: filters.status,
  });

  const items = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  const handleSort = (key: string, direction: "asc" | "desc") => {
    setSortBy(key as InventorySortField);
    setSortOrder(direction);
    setPage(1);
  };

  const handleFiltersChange = (next: InventoryFilterState) => {
    setFilters(next);
    setPage(1);
  };

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
            resultCount={meta?.total}
          />
        </div>

        <InventoryTable
          items={items}
          isLoading={isLoading}
          sortBy={sortBy}
          sortDir={sortOrder}
          onSort={handleSort}
          page={{ pageNumber: page, pageSize: PAGE_SIZE }}
          footer={
            meta && meta.totalPages > 0 ? (
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
                itemsPerPage={meta.pageSize}
                totalItems={meta.total}
              />
            ) : null
          }
        />

        {/* Filtered-set summary — server-side aggregates before pagination */}
        {data && (
          <div className="mt-3 text-sm text-[var(--color-text-secondary)]">
            {meta?.total ?? 0} products · Total Qty:{" "}
            <span className="font-medium text-[var(--color-text)]">
              {(data.summary.totalQuantitySum ?? 0).toLocaleString()}
            </span>{" "}
            · Stock Value:{" "}
            <span className="font-medium text-[var(--color-text)]">
              PKR {(data.summary.totalStockValue ?? 0).toLocaleString()}/-
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
