"use client";

import { Save } from "lucide-react";
import { UseFormHandleSubmit } from "react-hook-form";
import { SaleFormInput, SaleFormOutput } from "@/schemas/sale-form";

interface PosFooterProps {
  totals: {
    gross: number;
    discount: number;
    tax: number;
    net: number;
  };
  discountPercent?: number;
  taxPercent: number;
  onDiscountPercentChange: (value: number) => void;
  onTaxPercentChange: (value: number) => void;
  isSubmitting: boolean;
  handleSubmit: UseFormHandleSubmit<SaleFormInput, SaleFormOutput>;
  onSubmit: (data: SaleFormOutput) => Promise<void>;
}

export function PosFooter({
  totals,
  discountPercent,
  taxPercent,
  onDiscountPercentChange,
  onTaxPercentChange,
  isSubmitting,
  handleSubmit,
  onSubmit,
}: PosFooterProps) {
  return (
    <div className="sticky bottom-0 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Gross</span>
            <span className="text-gray-900 font-semibold min-w-[60px] text-right">
              {totals.gross.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 flex items-center gap-1">
              Discount
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) =>
                  onDiscountPercentChange(Number(e.target.value))
                }
                className="w-14 border rounded px-1.5 py-0.5 text-xs text-right"
              />
              %
            </span>
            <span className="text-green-600 font-semibold min-w-[60px] text-right">
              -{totals.discount.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 flex items-center gap-1">
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
            <span className="text-orange-600 font-semibold min-w-[60px] text-right">
              +{totals.tax.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <span className="text-gray-700 font-medium">Net Total</span>
            <span className="text-blue-700 text-xl font-bold min-w-[80px] text-right">
              {totals.net.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Processing...
            </span>
          ) : (
            "Complete Sale"
          )}
        </button>
      </div>
    </div>
  );
}
