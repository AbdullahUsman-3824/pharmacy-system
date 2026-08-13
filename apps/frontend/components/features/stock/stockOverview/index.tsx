"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStockVouchers } from "../../../../hooks/useStock";
import { StockVouchersTable } from "./StockVouchersTable";
import { StockVoucherType } from "@repo/shared";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
import { Plus } from "lucide-react";
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

export default function StockOverviewPage() {
  const router = useRouter();
  const { data: vouchers, isLoading } = useStockVouchers();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filteredVouchers = useMemo(() => {
    let result = vouchers ?? [];

    if (typeFilter !== "ALL") {
      result = result.filter((v) => v.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (v) =>
          v.voucherNumber.toLowerCase().includes(q) ||
          v.distributorName?.toLowerCase().includes(q),
      );
    }

    result = [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "netAmount") return (a.netAmount - b.netAmount) * dir;
      if (sortKey === "voucherNumber")
        return a.voucherNumber.localeCompare(b.voucherNumber) * dir;
      // default: date
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
    });

    return result;
  }, [vouchers, typeFilter, search, sortKey, sortDirection]);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(key);
    setSortDirection(direction);
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
              onChange={(value) => setSearch(value)}
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
          vouchers={filteredVouchers}
          isLoading={isLoading}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </PageSection>
    </PageContainer>
  );
}
