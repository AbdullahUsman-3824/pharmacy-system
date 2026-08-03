"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, Plus, Package, ShoppingCart, Boxes } from "lucide-react";

import Button from "@/components/ui/button";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { StatGrid } from "@/components/shared/stat-grid";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { RecentSales } from "@/components/features/dashboard/recent-sales";
import { RecentPurchases } from "@/components/features/dashboard/recent-purchases";
import LoadingState from "@/components/shared/loading-state";

import { useDashboard } from "@/hooks/useDashboard";

import type { RecentSale, StatCardData } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, isFetching, isError, refetch } = useDashboard();

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (isError || !data) {
    return <div>Error loading dashboard.</div>;
  }
  const stats: (StatCardData & { id: string; onClick?: () => void })[] = [
    {
      id: "today-sales",
      label: "Today's Sales",
      value: `Rs ${data.todaySales.totalAmount.toLocaleString()} (${data.todaySales.count})`,
      tone: "neutral",
      onClick: () => router.push("/sales?date=today"),
    },
    {
      id: "low-stock",
      label: "Low Stock",
      value: String(data.lowStockCount),
      tone: data.lowStockCount > 0 ? "warn" : "neutral",
      onClick: () => router.push("/inventory?status=low_stock"),
    },
    {
      id: "near-expiry",
      label: "Near Expiry",
      value: String(data.nearExpiryCount),
      tone: data.nearExpiryCount > 0 ? "danger" : "neutral",
      onClick: () => router.push("/inventory?status=near_expiry"),
    },
    {
      id: "out-of-stock",
      label: "Out of Stock",
      value: String(data.outOfStockCount ?? 0),
      tone: (data.outOfStockCount ?? 0) > 0 ? "danger" : "neutral",
      onClick: () => router.push("/inventory?status=out_of_stock"),
    },
  ];

  const recentSales: RecentSale[] = data.recentSales.map((sale) => ({
    id: sale.id,
    invoice: sale.saleNumber,
    amount: `Rs ${sale.totalAmount.toLocaleString()}`,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of today's pharmacy activity."
      >
        <Button
          variant="secondary"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </PageHeader>

      <PageSection>
        <StatGrid>
          {stats.map(({ onClick, ...stat }) => (
            <div
              key={stat.id}
              onClick={onClick}
              className={onClick ? "cursor-pointer" : undefined}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </StatGrid>
      </PageSection>

      <PageSection>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/pos")}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Sale
          </Button>
          <Button variant="outline" onClick={() => router.push("/stock/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Purchase
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/products/new")}
          >
            <Package className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button variant="outline" onClick={() => router.push("/inventory")}>
            <Boxes className="h-4 w-4 mr-2" />
            Check Stock
          </Button>
        </div>
      </PageSection>

      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">
              Recent Sales
            </h3>
            <RecentSales sales={recentSales} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">
              Recent Purchases
            </h3>
            <RecentPurchases purchases={data.recentPurchases ?? []} />
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}
