import type { SaleLineItem } from "@/lib/types";

interface ItemsTableProps {
  items: SaleLineItem[];
}

export function ItemsTable({ items }: ItemsTableProps) {
  return (
    <div className="mt-4 flex-1 rounded-xl border border-border bg-surface-card p-5 shadow-panel">
      <div className="grid grid-cols-[1fr_80px_100px_100px] border-b border-border-soft pb-2 text-sm text-ink-500">
        <span>Item</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Rate</span>
        <span className="text-right">Amount</span>
      </div>

      <div className="divide-y divide-border-soft">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_80px_100px_100px] items-center py-3 text-sm"
          >
            <span className="font-medium text-ink-900">{item.name}</span>
            <span className="text-right text-ink-700">{item.qty}</span>
            <span className="text-right text-ink-700">Rs {item.rate}</span>
            <span className="text-right font-medium text-ink-900">
              Rs {item.qty * item.rate}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
