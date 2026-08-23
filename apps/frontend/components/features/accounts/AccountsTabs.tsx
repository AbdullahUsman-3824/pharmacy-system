"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { label: "Customers", href: "/accounts/customers" },
  { label: "Suppliers", href: "/accounts/suppliers" },
  { label: "Banks", href: "/accounts/bank" },
];

export function AccountsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-out",
              "rounded-[var(--radius-sm)]",
              // Active state
              active
                ? [
                    "text-[var(--color-primary)]",
                    "bg-[var(--color-primary)]/10",
                    "shadow-[var(--shadow-sm)]",
                    "scale-[1.02]",
                    "after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-2/3 after:-translate-x-1/2",
                    "after:rounded-full after:bg-[var(--color-primary)] after:transition-all",
                  ]
                : [
                    "text-[var(--color-text-muted)]",
                    "hover:bg-[var(--color-background-muted)]",
                    "hover:text-[var(--color-text)]",
                    "hover:scale-[1.02]",
                    "active:scale-[0.98]",
                  ],
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
