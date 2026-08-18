import { Receipt } from "lucide-react";
import type { RecentSaleData } from "@repo/shared";

interface RecentSalesProps {
  sales: RecentSaleData[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)] cursor-pointer"
      onClick={() => (window.location.href = "/sales")}
    >
      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Receipt className="h-8 w-8 text-[var(--color-text-secondary)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">
            No recent sales
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            New sales will show up here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border-light)]">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between py-3 first:pt-0"
            >
              <span className="text-sm font-medium text-[var(--color-text)]">
                {sale.invoice}
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {sale.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
