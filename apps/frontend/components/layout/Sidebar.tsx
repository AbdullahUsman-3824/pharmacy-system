"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Layers,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";
import { navItems } from "@/lib/nav-data";
import type { NavKey } from "@/lib/types";

const icons: Record<NavKey, React.ElementType> = {
  dashboard: LayoutDashboard,
  pos: Receipt,
  products: Package,
  stock: Warehouse,
  sales: ShoppingCart,
  customers: Users,
  distributors: Truck,
  reports: BarChart3,
  inventory: Layers,
};

const collapsedByDefaultOn = ["/pos"];

export function Sidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(() =>
    collapsedByDefaultOn.some((p) => pathname.startsWith(p)),
  );

  return (
    <aside
      className={`shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sidebar)] transition-[width] duration-200 ${
        collapsed ? "w-[54px]" : "w-[236px]"
      }`}
    >
      <nav className="flex h-full flex-col gap-1 px-2 py-4">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-sidebar-hover)] transition-colors duration-200 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? (
            <ChevronsRight size={18} />
          ) : (
            <>
              <ChevronsLeft size={18} />
              <span>Collapse</span>
            </>
          )}
        </button>
        {navItems.map((item) => {
          const Icon = icons[item.key];
          const active = pathname.startsWith(item.href);
          const isComingSoon = item.comingSoon;

          return (
            <Link
              key={item.key}
              href={isComingSoon ? "/coming-soon" : item.href}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                active
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-sidebar-hover)]"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {isComingSoon && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-[var(--color-warning-soft)] text-[var(--color-warning-text)] px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
