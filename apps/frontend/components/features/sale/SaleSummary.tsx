interface SaleSummaryProps {
  gross: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  net: number;
  onDiscountPercentChange: (value: number) => void;
  onTaxPercentChange: (value: number) => void;
  isSubmitting?: boolean;
}

export function SaleSummary({
  gross,
  discountPercent,
  discountAmount,
  taxPercent,
  taxAmount,
  net,
  onDiscountPercentChange,
  onTaxPercentChange,
  isSubmitting,
}: SaleSummaryProps) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col rounded-xl border border-border bg-surface-card p-5 shadow-panel">
      <div className="flex items-center justify-between py-1.5 text-sm text-ink-700">
        <span>Gross</span>
        <span>Rs {gross.toFixed(2)}</span>
      </div>

      <div className="flex items-center justify-between py-1.5 text-sm text-ink-700">
        <span className="flex items-center gap-1.5">
          Discount
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={discountPercent}
            onChange={(e) => onDiscountPercentChange(Number(e.target.value))}
            className="w-14 border rounded px-1.5 py-0.5 text-xs text-right"
          />
          %
        </span>
        <span>Rs {discountAmount.toFixed(2)}</span>
      </div>

      <div className="flex items-center justify-between py-1.5 text-sm text-ink-700">
        <span className="flex items-center gap-1.5">
          Tax
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={taxPercent}
            onChange={(e) => onTaxPercentChange(Number(e.target.value))}
            className="w-14 border rounded px-1.5 py-0.5 text-xs text-right"
          />
          %
        </span>
        <span>Rs {taxAmount.toFixed(2)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border-soft pt-3">
        <span className="text-base font-semibold text-ink-900">Total</span>
        <span className="text-lg font-semibold text-ink-900">
          Rs {net.toFixed(2)}
        </span>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        Checkout (F12)
      </button>
    </div>
  );
}
