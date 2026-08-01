"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { label: "Products", href: "/products" },
  { label: "Companies", href: "/products/companies" },
  { label: "Types", href: "/products/types" },
  { label: "Groups", href: "/products/groups" },
  { label: "Generics", href: "/products/generics" },
];

export function ProductsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-[var(--shadow-xs)]">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-all duration-200",
              active
                ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
