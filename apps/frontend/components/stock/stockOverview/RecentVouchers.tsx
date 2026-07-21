import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, ArrowRight } from "lucide-react";
import { VoucherTypeBadge } from "../shared/VoucherTypeBadge";
import type { StockVoucherListItem } from "./types";

interface RecentVouchersProps {
  vouchers: StockVoucherListItem[];
  isLoading?: boolean;
  maxItems?: number;
}

export const RecentVouchers = ({
  vouchers,
  isLoading = false,
  maxItems = 5,
}: RecentVouchersProps) => {
  const router = useRouter();
  const recentVouchers = vouchers.slice(0, maxItems);

  const handleRowClick = (id: string) => {
    router.push(`/stock/vouchers/${id}`);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-700 text-sm">
              Recent Vouchers
            </h2>
          </div>
        </div>
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Loading vouchers...</p>
        </div>
      </div>
    );
  }

  // Empty State
  if (recentVouchers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-700 text-sm">
              Recent Vouchers
            </h2>
          </div>
        </div>
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500 mt-2">No vouchers created yet</p>
          <Link
            href="/stock/vouchers/new"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:text-slate-700 mt-1 transition-colors"
          >
            Create your first voucher
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // Data Table
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-700 text-sm">
              Recent Vouchers
            </h2>
          </div>
          <span className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
            Last {maxItems} entries
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/30">
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Voucher #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentVouchers.map((voucher) => (
              <tr
                key={voucher.id}
                className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                onClick={() => handleRowClick(voucher.id)}
              >
                <td className="px-6 py-3.5">
                  <span className="text-sm font-medium text-slate-900">
                    #{voucher.voucherNumber}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <VoucherTypeBadge type={voucher.type} />
                </td>
                <td className="px-6 py-3.5 text-sm text-slate-600">
                  {new Date(voucher.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 text-right">
                  PKR {voucher.netAmount.toFixed(2)}/-
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(voucher.id);
                    }}
                    className="text-sm text-slate-400 hover:text-slate-900 transition-colors font-medium"
                  >
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
