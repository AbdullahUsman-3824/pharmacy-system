"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useStockVoucher } from "@/hooks/useStock";
import { VoucherTypeBadge } from "@/components/stock/shared/VoucherTypeBadge";
import {
  ArrowLeft,
  Printer,
  Download,
  Loader2,
  Package,
  Calendar,
  Hash,
  Building2,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function ViewVoucherPage() {
  const { id } = useParams();
  const { data: voucher, isLoading, error } = useStockVoucher(id as string);
  const [isPrinting, setIsPrinting] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading voucher...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !voucher) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-800 mt-3">
            Voucher Not Found
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            The voucher you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href="/stock/vouchers"
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vouchers
          </Link>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setIsPrinting(false);
  };

  const handleDownload = () => {
    // Simple download as JSON
    const dataStr = JSON.stringify(voucher, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `voucher-${voucher.voucherNumber}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/stock/vouchers"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vouchers
          </Link>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Voucher Card */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Voucher Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">
                    Voucher #{voucher.voucherNumber}
                  </h1>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Created {new Date(voucher.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Total Amount</div>
                <div className="text-2xl font-bold text-blue-900">
                  PKR {voucher.netAmount.toFixed(2)}/-
                </div>
              </div>
            </div>
          </div>

          {/* Voucher Details */}
          <div className="px-6 py-5 border-b border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Hash className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Voucher Type
                  </p>
                  <p className="pt-2">
                    <VoucherTypeBadge type={voucher.type} />
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </p>
                  <p className="text-sm font-semibold text-slate-900 pt-1">
                    {new Date(voucher.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {voucher.supplierId && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <Building2 className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Supplier
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {voucher.supplier.name}
                    </p>
                  </div>
                </div>
              )}

              {voucher.remarks && (
                <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Remarks
                    </p>
                    <p className="text-sm text-slate-700">{voucher.remarks}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-slate-500" />
              <h2 className="font-semibold text-slate-700">Items</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {voucher.items?.length || 0} items
              </span>
            </div>

            {voucher.items && voucher.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/30">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Batch
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {voucher.items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {item.product.name}{" "}
                          <span className="text-xs text-slate-400">
                            ({item.product.code})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <div>
                            <span className="font-mono text-xs">
                              {item.batch.batchNumber}
                            </span>
                            {item.batch.expiryDate && (
                              <span className="text-xs text-slate-400 ml-2">
                                Exp:{" "}
                                {new Date(
                                  item.batch.expiryDate,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                          {item.quantity}
                          {item.freeQuantity > 0 && (
                            <span className="text-xs text-emerald-600 font-normal ml-1">
                              (+{item.freeQuantity} free)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 text-right">
                          PKR {item.purchaseRate.toFixed(2)}/-
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                          PKR {item.netAmount.toFixed(2)}/-
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500 mt-2">
                  No items in this voucher
                </p>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50">
            <div className="flex flex-col items-end space-y-1">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-500">Gross Amount:</span>
                <span className="font-medium text-slate-700">
                  PKR {voucher.grossAmount.toFixed(2)}/-
                </span>
              </div>
              {voucher.discountAmount > 0 && (
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-slate-500">Discount:</span>
                  <span className="font-medium text-rose-600">
                    -PKR {voucher.discountAmount.toFixed(2)}/-
                  </span>
                </div>
              )}
              {voucher.taxAmount > 0 && (
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-slate-500">Tax:</span>
                  <span className="font-medium text-slate-700">
                    +PKR {voucher.taxAmount.toFixed(2)}/-
                  </span>
                </div>
              )}
              <div className="flex items-center gap-6 text-base pt-1 border-t border-slate-200 w-full justify-end">
                <span className="font-semibold text-slate-700">
                  Net Amount:
                </span>
                <span className="font-bold text-slate-900 text-lg">
                  PKR {voucher.netAmount.toFixed(2)}/-
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
