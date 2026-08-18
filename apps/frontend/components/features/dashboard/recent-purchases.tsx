import type { RecentPurchaseData } from "@repo/shared";

interface RecentPurchasesProps {
  purchases: RecentPurchaseData[];
}

export function RecentPurchases({ purchases }: RecentPurchasesProps) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)]  cursor-pointer"
      onClick={() => (window.location.href = "/stock")}
    >
      <div className="divide-y divide-[var(--color-border-light)]">
        {purchases.map((purchase) => (
          <div
            key={purchase.id}
            className="flex items-center justify-between py-3 first:pt-0"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--color-text)]">
                {purchase.voucherNumber}
              </span>
              {purchase.distributorName && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  {purchase.distributorName}
                </span>
              )}
            </div>
            <span className="text-sm text-[var(--color-text-secondary)]">
              {purchase.totalAmount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
