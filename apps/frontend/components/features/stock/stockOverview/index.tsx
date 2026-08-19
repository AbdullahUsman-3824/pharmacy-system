"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStockVouchers } from "../../../../hooks/useStock";
import { StockVouchersTable } from "./StockVouchersTable";
import { StockVoucherType, StockVoucherSortField } from "@repo/shared";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { SearchBar } from "@/components/ui/searchBar";
import { Pagination } from "@/components/shared/pagination";

type SortDirection = "asc" | "desc";
type TypeFilter = "ALL" | StockVoucherType;

const TYPE_CHIPS: { label: string; value: TypeFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Purchase", value: StockVoucherType.PURCHASE },
  { label: "Purchase Return", value: StockVoucherType.PURCHASE_RETURN },
  { label: "Adjustment", value: StockVoucherType.STOCK_ADJUSTMENT },
];

const PAGE_SIZE = 25;

export default function StockOverviewPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data, isLoading } = useStockVouchers({
    page,
    pageSize: PAGE_SIZE,
    search,
    sortBy: sortKey as StockVoucherSortField,
    sortOrder: sortDirection,
    ...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
  });

  const vouchers = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(key);
    setSortDirection(direction);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeFilterChange = (value: TypeFilter) => {
    setTypeFilter(value);
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Stock Management"
        description="Purchases, purchase returns, and stock adjustments."
      >
        <Button onClick={() => router.push("/stock/new")}>
          <Plus className="w-4 h-4" />
          New Voucher
        </Button>
      </PageHeader>

      <PageSection>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <SearchBar
              placeholder="Search by voucher # or distributor..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {TYPE_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => handleTypeFilterChange(chip.value)}
                className={cn(
                  "rounded-[var(--radius-md)] border px-3 py-1.5 text-sm font-medium transition-colors",
                  typeFilter === chip.value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                    : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <StockVouchersTable
          vouchers={vouchers}
          isLoading={isLoading}
          sortKey={sortKey}
          sortDirection={sortDirection}
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
      </PageSection>
    </PageContainer>
  );
}
