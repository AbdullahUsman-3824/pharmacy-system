import type { RecentSale } from "@/lib/types";

interface RecentSalesProps {
  sales: RecentSale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-card p-5 shadow-panel">
      <p className="mb-3 text-sm text-ink-500">Recent sales</p>

      <div className="divide-y divide-border-soft">
        {sales.map((sale) => (
          <div key={sale.id} className="flex items-center justify-between py-3 first:pt-0">
            <span className="text-sm font-medium text-ink-900">{sale.invoice}</span>
            <span className="text-sm text-ink-700">{sale.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
