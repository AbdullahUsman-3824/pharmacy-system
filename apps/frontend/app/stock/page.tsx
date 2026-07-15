"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStockVouchers } from "../../hooks/useStock";
import { ProductSelect } from "../../components/ProductSelect";
import {
  Package,
  Plus,
  ArrowRight,
  Clock,
  FileText,
  DollarSign,
  Loader2,
} from "lucide-react";

export default function StockOverviewPage() {
  const router = useRouter();
  const { data: vouchers, isLoading } = useStockVouchers();
  const [productId, setProductId] = useState("");

  const recentVouchers = (vouchers ?? []).slice(0, 5);

  const getVoucherTypeBadge = (type: string) => {
    const types: Record<string, { color: string; label: string }> = {
      PURCHASE: { color: "bg-emerald-100 text-emerald-700", label: "Purchase" },
      SALE: { color: "bg-blue-100 text-blue-700", label: "Sale" },
      RETURN: { color: "bg-amber-100 text-amber-700", label: "Return" },
      ADJUSTMENT: {
        color: "bg-purple-100 text-purple-700",
        label: "Adjustment",
      },
    };
    return types[type] || { color: "bg-gray-100 text-gray-700", label: type };
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-200">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Stock Management
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Inventory overview & control
                </p>
              </div>
            </div>
            <Link
              href="/stock/vouchers/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-200 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New Voucher
            </Link>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check Product Stock Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-semibold text-slate-700">
                Check Product Stock
              </h2>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <ProductSelect value={productId} onChange={setProductId} />
              </div>
              <button
                type="button"
                disabled={!productId}
                onClick={() => router.push(`/stock/products/${productId}`)}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm whitespace-nowrap"
              >
                View
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vouchers Quick Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-700">Vouchers</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage all vouchers
                  </p>
                </div>
              </div>
              <Link
                href="/stock/vouchers"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Total vouchers</span>
                <span className="font-semibold text-slate-700">
                  {vouchers?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Vouchers Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                <h2 className="font-semibold text-slate-700">
                  Recent Vouchers
                </h2>
              </div>
              <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                Last 5 entries
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2 text-slate-500">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                Loading vouchers...
              </div>
            </div>
          ) : recentVouchers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex flex-col items-center gap-2">
                <FileText className="w-12 h-12 text-slate-300" />
                <p className="text-sm text-slate-500">
                  No vouchers created yet
                </p>
                <Link
                  href="/stock/vouchers/new"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                >
                  Create your first voucher
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Voucher #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Net Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentVouchers.map((v) => {
                    const badge = getVoucherTypeBadge(v.type);
                    return (
                      <tr
                        key={v.id}
                        className="hover:bg-blue-50/50 transition-colors duration-150 cursor-pointer"
                        onClick={() => router.push(`/stock/vouchers/${v.id}`)}
                      >
                        <td className="px-6 py-3 text-sm font-medium text-slate-700">
                          #{v.voucherNumber}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {new Date(v.voucherDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-3 text-sm font-semibold text-slate-700 text-right">
                          <span className="inline-flex items-center gap-1 justify-end">
                            <DollarSign className="w-3 h-3 text-slate-400" />
                            {v.netAmount.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
