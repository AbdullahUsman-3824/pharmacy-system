"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStockVouchers } from "../../../hooks/useStock";
import { StockHeader } from "./StockHeader";
import { StockStats } from "./StockStats";
import { StockActionCards } from "./StockActionCards";
import { RecentVouchers } from "./RecentVouchers";
import type { StockStats as StockStatsType } from "./types";

export default function StockOverviewPage() {
  const router = useRouter();
  const { data: vouchers, isLoading } = useStockVouchers();
  const [selectedProductId, setSelectedProductId] = useState("");

  // Memoized calculations - FIXED: Use correct enum values
  const stats = useMemo<StockStatsType>(() => {
    const total = vouchers?.length || 0;
    const purchases =
      vouchers?.filter((v) => v.type === "PURCHASE").length || 0;
    const sales =
      vouchers?.filter((v) => v.type === "PURCHASE_RETURN").length || 0;
    const totalValue = vouchers?.reduce((sum, v) => sum + v.netAmount, 0) || 0;

    return { total, purchases, sales, totalValue };
  }, [vouchers]);

  const activityCounts = useMemo(() => {
    const today = new Date().toDateString();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayCount =
      vouchers?.filter((v) => new Date(v.date).toDateString() === today)
        .length || 0;

    const weekCount =
      vouchers?.filter((v) => new Date(v.date) >= weekAgo).length || 0;

    return { todayCount, weekCount };
  }, [vouchers]);

  const handleViewProduct = () => {
    if (selectedProductId) {
      router.push(`/stock/products/${selectedProductId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Header Component */}
        <StockHeader />

        {/* Statistics Cards Component */}
        <StockStats stats={stats} isLoading={isLoading} />

        {/* Action Cards Component */}
        <StockActionCards
          selectedProductId={selectedProductId}
          onProductSelect={setSelectedProductId}
          onViewProduct={handleViewProduct}
          totalVouchers={stats.total}
          todayCount={activityCounts.todayCount}
          weekCount={activityCounts.weekCount}
        />

        {/* Recent Vouchers Table Component */}
        <RecentVouchers
          vouchers={vouchers || []}
          isLoading={isLoading}
          maxItems={5}
        />
      </div>
    </div>
  );
}
