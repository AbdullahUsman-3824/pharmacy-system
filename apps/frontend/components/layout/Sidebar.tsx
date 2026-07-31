"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  ReceiptText as Receipt,
} from "lucide-react";
import { navItems } from "@/lib/data";
import type { NavKey } from "@/lib/types";

const icons: Record<NavKey, React.ElementType> = {
  dashboard: LayoutDashboard,
  pos: Receipt,
  products: Package,
  stock: Boxes,
  sale: ShoppingCart,
  customers: Users,
  suppliers: Truck,
  reports: BarChart3,
};

const collapsedByDefaultOn = ["/sale"];

export function Sidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(() =>
    collapsedByDefaultOn.some((p) => pathname.startsWith(p)),
  );

  return (
    <aside
      className={`shrink-0 border-r border-border bg-surface-sidebar transition-[width] duration-200 ${
        collapsed ? "w-[54px]" : "w-[236px]"
      }`}
    >
      <nav className="flex h-full flex-col gap-1 px-2 py-4">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-surface-sunken ${
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
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-700 hover:bg-surface-sunken"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {isComingSoon && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
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
