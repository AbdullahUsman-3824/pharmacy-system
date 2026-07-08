interface SaleSummaryProps {
  gross: number;
  discount: number;
}

export function SaleSummary({ gross, discount }: SaleSummaryProps) {
  const total = gross - discount;

  return (
    <div className="flex w-[300px] shrink-0 flex-col rounded-xl border border-border bg-surface-card p-5 shadow-panel">
      <div className="flex items-center justify-between py-1.5 text-sm text-ink-700">
        <span>Gross</span>
        <span>Rs {gross}</span>
      </div>
      <div className="flex items-center justify-between py-1.5 text-sm text-ink-700">
        <span>Discount</span>
        <span>Rs {discount}</span>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border-soft pt-3">
        <span className="text-base font-semibold text-ink-900">Total</span>
        <span className="text-lg font-semibold text-ink-900">Rs {total}</span>
      </div>

      <button
        type="button"
        className="mt-5 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Checkout (F12)
      </button>
    </div>
  );
}
