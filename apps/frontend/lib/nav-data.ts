import type { NavItem } from "./types";

export const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "pos", label: "POS", href: "/pos" },
  { key: "sales", label: "Sales", href: "/sales" },
  { key: "stock", label: "Stock Management", href: "/stock" },
  { key: "inventory", label: "Inventory", href: "/inventory" },
  { key: "products", label: "Products Catalog", href: "/products" },
  // { key: "distributors", label: "Distributors", href: "/products/distributors" },
  // {
  //   key: "customers",
  //   label: "Customers",
  //   href: "/customers",
  //   comingSoon: true,
  // },
  // { key: "reports", label: "Reports", href: "/reports", comingSoon: true },
];
