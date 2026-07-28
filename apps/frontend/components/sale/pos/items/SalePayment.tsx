"use client";

import { useState, forwardRef, useImperativeHandle } from "react";

export interface SalePaymentRef {
  complete: () => void;
}

interface SalePaymentProps {
  netAmount: number;
  saleCompleted: boolean;
  onComplete?: (paidAmount: number) => void;
  onPrint?: () => void;
  paymentError?: string | null;
}

function getQuickAmounts(netAmount: number): number[] {
  if (netAmount <= 0) return [500, 1000, 2000, 5000];
  const steps = [50, 100, 500, 1000];
  const amounts = steps
    .map((step) => Math.ceil(netAmount / step) * step)
    .filter((val) => val > netAmount);
  return Array.from(new Set(amounts)).slice(0, 4);
}

export const SalePayment = forwardRef<SalePaymentRef, SalePaymentProps>(
  function SalePayment(
    { netAmount, saleCompleted, onComplete, onPrint, paymentError },
    ref,
  ) {
    const [paidBy, setPaidBy] = useState<"Cash" | "Card" | "Other">("Cash");
    const [amountPaid, setAmountPaid] = useState<number>(netAmount);

    // Adjusted during render (not in an effect) so React applies it in the
    // same pass — see https://react.dev/learn/you-might-not-need-an-effect
    const [prevNetAmount, setPrevNetAmount] = useState(netAmount);
    if (netAmount !== prevNetAmount) {
      setPrevNetAmount(netAmount);
      setAmountPaid(netAmount);
    }

    const change = amountPaid - netAmount;
    const quickAmounts = getQuickAmounts(netAmount);

    useImperativeHandle(ref, () => ({
      complete: () => onComplete?.(amountPaid),
    }));

    return (
      <div className="bg-white rounded-lg shadow-xs p-4 flex flex-col h-full">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Payment
        </h3>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Paid by</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value as typeof paidBy)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">
            Amount paid
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              step="0.01"
              min="0"
            />
            <span className="text-sm text-gray-500">PKR</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {quickAmounts.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setAmountPaid(val)}
              className={`px-3 py-1 text-sm border rounded transition-colors ${
                amountPaid === val
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center border-t border-gray-200 pt-3 mb-1">
          <span className="text-sm font-medium text-gray-700">Change</span>
          <span
            className={`text-lg font-bold ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            PKR {change >= 0 ? change.toFixed(2) : "0.00"}
          </span>
        </div>

        {paymentError && (
          <p className="text-xs text-red-600 font-medium mb-3">
            {paymentError}
          </p>
        )}

        <div className="mt-auto space-y-2">
          <button
            type="button"
            onClick={() => onComplete?.(amountPaid)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-sm">F5</span> Complete sale
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={!saleCompleted}
            title={
              saleCompleted ? undefined : "Complete the sale before printing"
            }
            className="w-full bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 font-medium py-2 rounded transition-colors text-sm"
          >
            Print invoice
          </button>
        </div>
      </div>
    );
  },
);
