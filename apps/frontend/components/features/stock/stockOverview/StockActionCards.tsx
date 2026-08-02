import Link from "next/link";
import { Package, Clock, ArrowRight } from "lucide-react";
import { ProductSelect } from "../../../ProductSelect";

interface StockActionCardsProps {
  selectedProductId: string;
  onProductSelect: (id: string) => void;
  onViewProduct: () => void;
  totalVouchers: number;
  todayCount: number;
  weekCount: number;
}

export const StockActionCards = ({
  selectedProductId,
  onProductSelect,
  onViewProduct,
  totalVouchers,
  todayCount,
  weekCount,
}: StockActionCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Check Product Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-700 text-sm">
            Check Product Stock
          </h2>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <ProductSelect
              value={selectedProductId}
              onChange={onProductSelect}
              onKeyDown={(e) => e.key === "Enter" && onViewProduct()}
            />
          </div>
          <button
            onClick={onViewProduct}
            disabled={!selectedProductId}
            className="px-5 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm whitespace-nowrap flex items-center gap-1.5"
          >
            View Stock
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-700 text-sm">
              Recent Activity
            </h2>
          </div>
          <Link
            href="/stock/vouchers"
            className="text-sm text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-500">Today</span>
            <span className="ml-2 font-semibold text-slate-900">
              {todayCount}
            </span>
          </div>
          <div>
            <span className="text-slate-500">This week</span>
            <span className="ml-2 font-semibold text-slate-900">
              {weekCount}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Total</span>
            <span className="ml-2 font-semibold text-slate-900">
              {totalVouchers}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
