import { ReactNode } from "react";
import Card from "../ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: "default" | "success" | "warning" | "danger" | "info";
}

const StatCard = ({
  label,
  value,
  icon,
  trend,
  color = "default",
}: StatCardProps) => {
  const colorStyles = {
    default: "text-[var(--color-text)]",
    success: "text-[var(--color-success)]",
    warning: "text-[var(--color-warning)]",
    danger: "text-[var(--color-danger)]",
    info: "text-[var(--color-info)]",
  };
  const isPositive = trend && trend.value > 0;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className={`mt-1 text-2xl font-bold ${colorStyles[color]}`}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`inline-flex items-center text-sm font-medium ${
                  isPositive
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-danger)]"
                }`}
              >
                {isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-[var(--color-text-muted)]">
                {trend.label}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`p-3 rounded-[var(--radius-sm)] bg-[var(--color-background-muted)] ${colorStyles[color]}`}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
