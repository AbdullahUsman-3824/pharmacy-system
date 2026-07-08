"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <div className="flex gap-6 border-b border-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
              active
                ? "border-brand text-brand"
                : "border-transparent text-ink-500 hover:text-ink-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}