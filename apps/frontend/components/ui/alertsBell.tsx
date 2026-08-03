"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, Clock, PackageX } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { cn } from "@/lib/cn";

export function AlertsBell() {
  const router = useRouter();
  const { data } = useDashboard();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lowStock = data?.lowStockCount ?? 0;
  const nearExpiry = data?.nearExpiryCount ?? 0;
  const outOfStock = data?.outOfStockCount ?? 0;
  const totalAlerts = lowStock + nearExpiry + outOfStock;

  const alertItems = [
    {
      key: "low_stock",
      label: "Low Stock",
      count: lowStock,
      icon: <AlertTriangle className="w-4 h-4" />,
      tone: "warning" as const,
    },
    {
      key: "near_expiry",
      label: "Near Expiry",
      count: nearExpiry,
      icon: <Clock className="w-4 h-4" />,
      tone: "warning" as const,
    },
    {
      key: "out_of_stock",
      label: "Out of Stock",
      count: outOfStock,
      icon: <PackageX className="w-4 h-4" />,
      tone: "danger" as const,
    },
  ].filter((item) => item.count > 0);

  const toneClasses = {
    warning: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
    danger: "text-[var(--color-danger)] bg-[var(--color-danger)]/10",
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-[var(--color-row-hover)] transition-colors"
        aria-label="Alerts"
      >
        <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
        {totalAlerts > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-semibold">
            {totalAlerts > 99 ? "99+" : totalAlerts}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-md,0_4px_12px_rgba(0,0,0,0.1))] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              Alerts
            </span>
          </div>

          {alertItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]">
              No active alerts
            </div>
          ) : (
            <div className="py-1">
              {alertItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/inventory?status=${item.key}`);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[var(--color-row-hover)] transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex items-center justify-center h-7 w-7 rounded-full",
                        toneClasses[item.tone],
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text)]">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
