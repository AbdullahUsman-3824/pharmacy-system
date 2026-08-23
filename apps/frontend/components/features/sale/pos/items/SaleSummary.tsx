"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";

export interface SaleSummaryRef {
  openDiscountEditor: () => void;
  openTaxEditor: () => void;
}

interface SaleSummaryProps {
  itemsCount: number;
  totalQuantity: number;
  grossAmount: number;
  discount: number;
  tax: number;
  netAmount: number;
  discountPercent: number;
  taxPercent: number;
  onDiscountPercentChange: (value: number) => void;
  onTaxPercentChange: (value: number) => void;
}

export const SaleSummary = forwardRef<SaleSummaryRef, SaleSummaryProps>(
  function SaleSummary(
    {
      itemsCount,
      totalQuantity,
      grossAmount,
      discount,
      tax,
      netAmount,
      discountPercent,
      taxPercent,
      onDiscountPercentChange,
      onTaxPercentChange,
    },
    ref,
  ) {
    const discountInputRef = useRef<HTMLInputElement>(null);
    const taxInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      openDiscountEditor: () => {
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
      },
      openTaxEditor: () => {
        taxInputRef.current?.focus();
        taxInputRef.current?.select();
      },
    }));

    return (
      <div className="bg-white rounded-lg shadow-xs p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Summary
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Items</span>
            <span className="font-medium">{itemsCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total quantity</span>
            <span className="font-medium">{totalQuantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Gross amount</span>
            <span className="font-medium">PKR {grossAmount.toFixed(2)}</span>
          </div>

          <SummaryPercentRow
            inputRef={discountInputRef}
            label="Discount (-)"
            percent={discountPercent}
            amount={discount}
            amountClassName="text-red-600"
            onPercentChange={onDiscountPercentChange}
          />

          <SummaryPercentRow
            inputRef={taxInputRef}
            label="Tax (+)"
            percent={taxPercent}
            amount={tax}
            onPercentChange={onTaxPercentChange}
          />

          <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-base">
            <span>Net amount</span>
            <span className="text-blue-700 font-bold text-lg">PKR {netAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  },
);

interface SummaryPercentRowProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  label: string;
  percent: number;
  amount: number;
  amountClassName?: string;
  onPercentChange: (value: number) => void;
}

function SummaryPercentRow({
  inputRef,
  label,
  percent,
  amount,
  amountClassName,
  onPercentChange,
}: SummaryPercentRowProps) {
  return (
    <div className="flex justify-between items-center text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">{label}</span>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            value={percent}
            onChange={(e) => onPercentChange(Number(e.target.value) || 0)}
            className="w-14 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            step="0.1"
            min="0"
            max="100"
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </div>
      <span className={`font-medium ${amountClassName ?? ""}`}>
        PKR {amount.toFixed(2)}
      </span>
    </div>
  );
}
