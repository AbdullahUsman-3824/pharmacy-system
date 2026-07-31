"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { useDashboard } from "@/hooks/useDashboard";
import type { StatCardData, RecentSale } from "@/lib/types";

export default function DashboardPage() {
  const { data, isLoading, isFetching, isError, refetch } = useDashboard();

  const nearExpiryCount = data?.nearExpiryCount;

  useEffect(() => {
    if (nearExpiryCount && nearExpiryCount > 0) {
      toast.warning(
        `${nearExpiryCount} batch${nearExpiryCount === 1 ? "" : "es"} expiring within 30 days`,
        {
          description:
            "Stock module me check karein — FEFO order me nikalna hai.",
          duration: 6000,
        },
      );
    }
  }, [nearExpiryCount]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Dashboard data load nahi ho saki.{" "}
        <button onClick={() => refetch()} className="underline">
          Retry
        </button>
      </div>
    );
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

  const recentSalesForTable: RecentSale[] = data.recentSales.map((s) => ({
    id: s.id,
    invoice: s.saleNumber,
    amount: `Rs ${s.totalAmount.toLocaleString()}`,
  }));

  return (
    <>
      <div className="flex items-center justify-end">
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-2">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="mt-4">
        <RecentSales sales={recentSalesForTable} />
      </div>
    </>
  );
}
