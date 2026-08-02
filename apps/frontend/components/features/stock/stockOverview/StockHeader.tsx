import Link from "next/link";
import { Plus } from "lucide-react";

interface StockHeaderProps {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}

export const StockHeader = ({
  title = "Stock Overview",
  subtitle = "Real-time inventory status and voucher management",
  actionLabel = "Create Voucher",
  actionHref = "/stock/vouchers/new",
}: StockHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-blue-900 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg hover:bg-blue-800 transition-colors font-medium text-sm shadow-sm whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        {actionLabel}
      </Link>
    </div>
  );
};
