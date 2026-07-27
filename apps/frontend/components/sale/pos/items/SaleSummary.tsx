"use client";

interface SaleSummaryProps {
  itemsCount: number;
  totalQuantity: number;
  grossAmount: number;
  discount: number;
  tax: number;
  netAmount: number;
}

export function SaleSummary({
  itemsCount,
  totalQuantity,
  grossAmount,
  discount,
  tax,
  netAmount,
}: SaleSummaryProps) {
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
          <span className="text-gray-500">Total Quantity</span>
          <span className="font-medium">{totalQuantity}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Gross Amount</span>
          <span className="font-medium">PKR {grossAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Discount (-)</span>
          <span className="font-medium text-red-600">
            PKR {discount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tax (+)</span>
          <span className="font-medium">PKR {tax.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-base">
          <span>NET AMOUNT</span>
          <span className="text-blue-700">PKR {netAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}