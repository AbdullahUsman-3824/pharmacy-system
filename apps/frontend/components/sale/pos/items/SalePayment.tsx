"use client";

import { useState } from "react";

interface SalePaymentProps {
  netAmount: number;
  onComplete?: (paidAmount: number) => void;
  onPrint?: () => void;
  onSaveDraft?: () => void;
}

const quickAmounts = [700, 750, 800, 1000];

export function SalePayment({
  netAmount,
  onComplete,
  onPrint,
  onSaveDraft,
}: SalePaymentProps) {
  const [paidBy, setPaidBy] = useState<"Cash" | "Card" | "Other">("Cash");
  const [amountPaid, setAmountPaid] = useState<number>(netAmount);
  const change = amountPaid - netAmount;

  const handleAmountClick = (val: number) => {
    setAmountPaid(val);
  };

  return (
    <div className="bg-white rounded-lg shadow-xs p-4 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
        Payment
      </h3>

      {/* Paid By */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Paid By</label>
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

      {/* Amount Paid */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Amount Paid</label>
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

      {/* Quick amount buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickAmounts.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => handleAmountClick(val)}
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

      {/* Change */}
      <div className="flex justify-between items-center border-t border-gray-200 pt-3 mb-4">
        <span className="text-sm font-medium text-gray-700">Change</span>
        <span
          className={`text-lg font-bold ${
            change >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          PKR {change >= 0 ? change.toFixed(2) : "0.00"}
        </span>
      </div>

      {/* Action Buttons – push to bottom */}
      <div className="mt-auto space-y-2">
        <button
          type="button"
          onClick={() => onComplete?.(amountPaid)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-sm">F5</span> Complete Sale
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded transition-colors text-sm"
          >
            Print Invoice
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded transition-colors text-sm"
          >
            F7 Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}