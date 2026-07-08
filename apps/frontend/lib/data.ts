import type {
  NavItem,
  RecentSale,
  SaleLineItem,
  StatCardData,
  LookupEntity,
  Product,
} from "./types";

export const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "products", label: "Products Master", href: "/products" },
  { key: "stock", label: "Stock", href: "/stock" },
  { key: "sale", label: "Sale", href: "/sale" },
  { key: "customers", label: "Customers", href: "/customers" },
  { key: "suppliers", label: "Suppliers", href: "/suppliers" },
  { key: "reports", label: "Reports", href: "/reports" },
];

export const dashboardStats: StatCardData[] = [
  { id: "sales", label: "Today's sales", value: "Rs 42,300", tone: "neutral" },
  { id: "low-stock", label: "Low stock", value: "6 items", tone: "warn" },
  {
    id: "near-expiry",
    label: "Near expiry",
    value: "3 batches",
    tone: "danger",
  },
  { id: "products", label: "Products", value: "1,284", tone: "neutral" },
];

export const recentSales: RecentSale[] = [
  { id: "1", invoice: "Invoice #1042", amount: "Rs 850" },
  { id: "2", invoice: "Invoice #1041", amount: "Rs 1,240" },
];

export const saleLineItems: SaleLineItem[] = [
  { id: "1", name: "Panadol 500mg", qty: 2, rate: 15 },
  { id: "2", name: "Augmentin 625", qty: 1, rate: 340 },
];

export const companies: LookupEntity[] = [
  { id: "c1", code: "GSK", name: "GlaxoSmithKline" },
  { id: "c2", code: "ABT", name: "Abbott Laboratories" },
  { id: "c3", code: "SNF", name: "Sanofi" },
  { id: "c4", code: "HIL", name: "Highnoon Laboratories" },
  { id: "c5", code: "GET", name: "Getz Pharma" },
];

export const productTypes: LookupEntity[] = [
  { id: "t1", code: "TAB", name: "Tablet" },
  { id: "t2", code: "SYR", name: "Syrup" },
  { id: "t3", code: "INJ", name: "Injection" },
];

export const productGroups: LookupEntity[] = [
  { id: "g1", code: "ANLG", name: "Analgesic" },
  { id: "g2", code: "ANTB", name: "Antibiotic" },
];

export const generics: LookupEntity[] = [
  { id: "gn1", code: "PARA", name: "Paracetamol" },
  { id: "gn2", code: "AMOX", name: "Amoxicillin" },
];

export const products: Product[] = [
  {
    id: "p1",
    name: "Panadol 500mg",
    companyId: "c1",
    typeId: "t1",
    groupId: "g1",
    genericId: "gn1",
    retailPrice: 15,
  },
  {
    id: "p2",
    name: "Augmentin 625",
    companyId: "c1",
    typeId: "t1",
    groupId: "g2",
    genericId: "gn2",
    retailPrice: 340,
  },
];
