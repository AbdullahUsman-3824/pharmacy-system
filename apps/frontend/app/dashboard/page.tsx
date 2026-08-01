"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/button";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";

import { StatGrid } from "@/components/shared/stat-grid";

import { StatCard } from "@/components/features/dashboard/stat-card";
import { RecentSales } from "@/components/features/dashboard/recent-sales";

import LoadingState from "@/components/shared/loading-state";

import { useDashboard } from "@/hooks/useDashboard";

import type { RecentSale, StatCardData } from "@/lib/types";

export default function DashboardPage() {
  const { data, isLoading, isFetching, isError, refetch } = useDashboard();

  const nearExpiryCount = data?.nearExpiryCount;

  useEffect(() => {
    if (nearExpiryCount && nearExpiryCount > 0) {
      toast.warning(
        `${nearExpiryCount} batch${nearExpiryCount === 1 ? "" : "es"} expiring within 30 days`,
        { duration: 6000 },
      );
    }
  }, [nearExpiryCount]);

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (isError || !data) {
    return <div>Error loading dashboard.</div>;
  }

  const stats: (StatCardData & { id: string })[] = [
    {
      id: "today-sales",
      label: "Today's Sales",
      value: `Rs ${data.todaySales.totalAmount.toLocaleString()} (${data.todaySales.count})`,
      tone: "neutral",
    },
    {
      id: "low-stock",
      label: "Low Stock",
      value: String(data.lowStockCount),
      tone: data.lowStockCount > 0 ? "warn" : "neutral",
    },
    {
      id: "near-expiry",
      label: "Near Expiry",
      value: String(data.nearExpiryCount),
      tone: data.nearExpiryCount > 0 ? "danger" : "neutral",
    },
    {
      id: "total-products",
      label: "Total Products",
      value: String(data.totalProducts),
      tone: "neutral",
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
          {stats.map((stat) => (
            <StatCard key={stat.id} {...stat} />
          ))}
        </StatGrid>
      </PageSection>

      <PageSection title="Recent Sales">
        <RecentSales sales={recentSales} />
      </PageSection>
    </PageContainer>
  );
}
