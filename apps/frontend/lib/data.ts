import type { NavItem } from "./types";

export const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "pos", label: "POS", href: "/pos" },
  { key: "products", label: "Products Catalog", href: "/products" },
  { key: "stock", label: "Stock", href: "/stock" },
  { key: "sales", label: "Sales", href: "/sales" },
  {
    key: "customers",
    label: "Customers",
    href: "/customers",
    comingSoon: true,
  },
  { key: "suppliers", label: "Suppliers", href: "/suppliers" },
  { key: "reports", label: "Reports", href: "/reports", comingSoon: true },
];
