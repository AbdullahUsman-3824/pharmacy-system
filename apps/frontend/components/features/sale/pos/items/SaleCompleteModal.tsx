"use client";

import { Check, Printer, Plus } from "lucide-react";
import type { SerializedSale } from "@repo/shared";

interface SaleCompleteModalProps {
  sale: SerializedSale;
  onPrint: () => void;
  onNewSale: () => void;
}

export function SaleCompleteModal({
  sale,
  onPrint,
  onNewSale,
}: SaleCompleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 border-b border-gray-100 px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Sale completed
          </h2>
          <p className="text-sm text-gray-500">
            Invoice{" "}
            <span className="font-semibold text-gray-800">
              #{sale.saleNumber}
            </span>
          </p>
        </div>

        {/* Line items */}
        <div className="max-h-64 overflow-y-auto px-6 py-4">
          <div className="mb-3 flex justify-between text-xs text-gray-500">
            <span>{sale.customerName ?? "Walk-in Customer"}</span>
            <span>{new Date(sale.date).toLocaleDateString()}</span>
          </div>

          <div className="space-y-1.5">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.productName}
                  <span className="text-gray-400">
                    {" "}
                    ×{item.packQuantity}
                    {item.looseQuantity ? ` + ${item.looseQuantity}u` : ""}
                  </span>
                </span>
                <span className="font-medium text-gray-800">
                  {item.netAmount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals breakdown — only shown when discount/tax actually apply */}
          <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Gross amount</span>
              <span>PKR {sale.grossAmount.toFixed(2)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount ({sale.discountPercent}%)</span>
                <span>- PKR {sale.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {sale.taxAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Tax ({sale.taxPercent}%)</span>
                <span>+ PKR {sale.taxAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="mt-2 border-t border-gray-100 pt-3 flex justify-between text-base font-semibold">
            <span>Net amount</span>
            <span className="text-blue-700">
              PKR {sale.netAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onPrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Print receipt
          </button>
          <button
            type="button"
            onClick={onNewSale}
            autoFocus
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New sale
          </button>
        </div>
      </div>
    </div>
  );
}
