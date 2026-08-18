import React from "react";
import { StatGrid } from "@/components/shared/stat-grid";
import { StatCard } from "@/components/features/dashboard/stat-card";
import type { StatCardData } from "@/lib/types";
import { useRouter } from "next/navigation";
import type { DashboardStatsDto } from "@repo/shared";

const Stats = (data: DashboardStatsDto) => {
  const router = useRouter();
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
  return (
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
  );
};

export default Stats;
