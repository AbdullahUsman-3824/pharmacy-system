import type { StockVoucherType } from "@repo/shared";
import { VOUCHER_TYPES } from "../stockOverview/types";

interface VoucherTypeBadgeProps {
  type: StockVoucherType;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export const VoucherTypeBadge = ({
  type,
  size = "md",
  showIcon = true,
}: VoucherTypeBadgeProps) => {
  const config = VOUCHER_TYPES[type];

  // Fallback if type doesn't exist in config
  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
        {type}
      </span>
    );
  }

  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border ${config.color} ${sizeClasses[size]}`}
    >
      {showIcon && (
        <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      )}
      {config.label}
    </span>
  );
};
