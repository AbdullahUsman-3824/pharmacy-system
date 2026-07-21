import { FileText, HandCoins, ShoppingCart, BadgeCent } from "lucide-react";
import { StatCard } from "../shared/StatCard";
import type { StockStats as StockStatsType } from "./types";

interface StockStatsProps {
  stats: StockStatsType;
  isLoading?: boolean;
}

export const StockStats = ({ stats, isLoading = false }: StockStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse"
          >
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Vouchers"
        value={stats.total}
        icon={<FileText className="w-5 h-5 text-slate-600" />}
        // trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        label="Purchases"
        value={stats.purchases}
        icon={<ShoppingCart className="w-5 h-5 text-slate-600" />}
      />
      <StatCard
        label="Sales"
        value={stats.sales}
        icon={<HandCoins className="w-5 h-5 text-slate-600" />}
      />
      <StatCard
        label="Total Value"
        value={`PKR ${stats.totalValue.toFixed(2)}/-`}
        icon={<BadgeCent className="w-5 h-5 text-slate-600" />}
      />
    </div>
  );
};
