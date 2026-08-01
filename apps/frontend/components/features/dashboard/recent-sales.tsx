import type { RecentSale } from "@/lib/types";

interface RecentSalesProps {
  sales: RecentSale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)]">
      <p className="mb-3 text-sm text-[var(--color-text-muted)]">
        Recent sales
      </p>

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
    </div>
  );
}
