// lib/types.ts
export type NavKey =
  | "dashboard"
  | "pos"
  | "products"
  | "stock"
  | "sales"
  | "customers"
  | "suppliers"
  | "reports";
  
export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  comingSoon?: boolean;
}

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  tone: "neutral" | "warn" | "danger";
}

export interface RecentSale {
  id: string;
  invoice: string;
  amount: string;
}

export interface SaleLineItem {
  id: string;
  name: string;
  qty: number;
  rate: number;
}

export interface LookupEntity {
  id: string;
  code: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  companyId: string | null;
  typeId: string | null;
  groupId: string | null;
  genericId: string | null;
  retailPrice: number;
}

export type LookupKind = "companies" | "types" | "groups" | "generics";
