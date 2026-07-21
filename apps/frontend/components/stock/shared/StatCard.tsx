import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({
  label,
  value,
  icon,
  trend,
  className = "",
}: StatCardProps) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <p
              className={`text-xs font-medium mt-1 ${
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last
              month
            </p>
          )}
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg">{icon}</div>
      </div>
    </div>
  );
};
