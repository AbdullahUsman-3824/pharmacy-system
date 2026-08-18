"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStockVouchers } from "../../../../hooks/useStock";
import { StockVouchersTable } from "./StockVouchersTable";
import { StockVoucherType } from "@repo/shared";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { SearchBar } from "@/components/ui/searchBar";

type SortDirection = "asc" | "desc";
type TypeFilter = "ALL" | StockVoucherType;

const TYPE_CHIPS: { label: string; value: TypeFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Purchase", value: StockVoucherType.PURCHASE },
  { label: "Purchase Return", value: StockVoucherType.PURCHASE_RETURN },
  { label: "Adjustment", value: StockVoucherType.STOCK_ADJUSTMENT },
];

const PAGE_SIZE = 20;

export default function StockOverviewPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data, isLoading } = useStockVouchers({
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    search,
  });

  const vouchers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // type filter aur sort abhi client-side hi
  const displayedVouchers = useMemo(() => {
    let result = vouchers;

    if (typeFilter !== "ALL") {
      result = result.filter((v) => v.type === typeFilter);
    }

    result = [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "netAmount") return (a.netAmount - b.netAmount) * dir;
      if (sortKey === "voucherNumber")
        return a.voucherNumber.localeCompare(b.voucherNumber) * dir;
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
    });

    return result;
  }, [vouchers, typeFilter, sortKey, sortDirection]);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // naya search shuru ho to page 1 pe wapas
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
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
                onClick={() => setTypeFilter(chip.value)}
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
          vouchers={displayedVouchers}
          isLoading={isLoading}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-[var(--color-text-secondary)]">
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}
