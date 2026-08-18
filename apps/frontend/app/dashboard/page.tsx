"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { usePageShortcuts } from "@/lib/shortcuts/usePageShortcuts";

import Stats from "@/components/features/dashboard/stats";
import QuickActions from "@/components/features/dashboard/quick-actions";
import { RecentSales } from "@/components/features/dashboard/recent-sales";
import { RecentPurchases } from "@/components/features/dashboard/recent-purchases";
import LoadingState from "@/components/shared/loading-state";
import Button from "@/components/ui/button";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { RefreshCw } from "lucide-react";

import { RecentPurchaseData, RecentSaleData } from "@repo/shared";

export default function DashboardPage() {
  const { data, isLoading, isFetching, isError, refetch } = useDashboard();

  usePageShortcuts([
    {
      id: "dashboard-refresh",
      shortcut: "Ctrl+R",
      description: "Refresh Dashboard",
      priority: 300,
      execute: refetch,
    },
  ]);

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (isError || !data) {
    return <div>Error loading dashboard.</div>;
  }

  const recentSales: RecentSaleData[] = data.recentSales.map((sale) => ({
    id: sale.id,
    invoice: sale.saleNumber,
    amount: `Rs ${sale.totalAmount.toLocaleString()}`,
  }));

  const recentPurchases: RecentPurchaseData[] = data.recentPurchases.map(
    (purchase) => ({
      id: purchase.id,
      voucherNumber: `# ${purchase.voucherNumber}`,
      distributorName: purchase.distributorName,
      totalAmount: `Rs ${purchase.totalAmount.toLocaleString()}`,
    }),
  );

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
        <Stats {...data} />
      </PageSection>

      <PageSection>
        <QuickActions />
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
            <RecentPurchases purchases={recentPurchases} />
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}
