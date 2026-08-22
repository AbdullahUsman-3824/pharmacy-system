"use client";

import { VoucherTotals } from "./useStockVoucherForm";
import Button from "@/components/ui/button";
import { Save } from "lucide-react";
import PaymentSelect from "@/components/shared/payment-select";
import { PaymentOption } from "@/components/shared/payment-select";

interface Props {
  totals: VoucherTotals;
  onSave: () => void;
  isSubmitting: boolean;
  selectedPayment?: PaymentOption | null;
  onPaymentChange: (option: PaymentOption) => void;
}

export function VoucherTotalsBar({
  totals,
  onSave,
  isSubmitting,
  selectedPayment,
  onPaymentChange,
}: Props) {
  return (
    <div className="sticky bottom-0 bg-gray-100 rounded-lg shadow-xl border border-gray-400">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-500">
            Gross{" "}
            <span className="text-gray-900 font-medium">
              {totals.gross.toFixed(2)}
            </span>
          </span>
          <span className="text-gray-500">
            Disc{" "}
            <span className="text-green-600 font-medium">
              -{totals.discount.toFixed(2)}
            </span>
          </span>
          <span className="text-gray-500">
            Tax{" "}
            <span className="text-orange-600 font-medium">
              +{totals.tax.toFixed(2)}
            </span>
          </span>
          <span className="text-base font-semibold text-gray-900">
            Net{" "}
            <span className="text-blue-800 text-xl font-bold ml-1">
              {totals.net.toFixed(2)}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-52">
            <PaymentSelect
              value={selectedPayment}
              onChange={onPaymentChange}
              placeholder="Payment method"
              placement="top"
            />
          </div>
          <Button onClick={onSave} disabled={isSubmitting}>
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Voucher"}
          </Button>
        </div>
      </div>
    </div>
  );
}
