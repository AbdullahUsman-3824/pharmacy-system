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
} from "lucide-react";
import { navItems } from "@/lib/data";
import type { NavKey } from "@/lib/types";

const icons: Record<NavKey, React.ElementType> = {
  dashboard: LayoutDashboard,
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

  const [prevPathname, setPrevPathname] = useState(pathname);
  const [collapsed, setCollapsed] = useState(() =>
    collapsedByDefaultOn.includes(pathname),
  );

  // route badla to render ke dauran hi collapsed reset kar do — koi useEffect nahi
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setCollapsed(collapsedByDefaultOn.some((p) => pathname.startsWith(p)));
  }

  return (
    <aside
      className={`shrink-0 border-r border-border bg-surface-sidebar transition-[width] duration-200 ${
        collapsed ? "w-[72px]" : "w-[236px]"
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

          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-700 hover:bg-surface-sunken"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
