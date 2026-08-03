import type { GlobalShortcut } from "./types";

export const GLOBAL_SHORTCUTS: GlobalShortcut[] = [
  {
    id: "dashboard",
    shortcut: "F1",
    description: "Dashboard",
    path: "/dashboard",
  },
  {
    id: "sale",
    shortcut: "F2",
    description: "New Sale",
    path: "/pos",
  },
  {
    id: "purchase",
    shortcut: "F3",
    description: "New Purchase",
    path: "/stock/new",
  },
  {
    id: "product",
    shortcut: "F4",
    description: "Add Product",
    path: "/products/new",
  },
  {
    id: "inventory",
    shortcut: "F5",
    description: "Check Inventory",
    path: "/inventory",
  },
  {
    id: "products",
    shortcut: "Ctrl+P",
    description: "Products",
    path: "/products",
  },
  {
    id: "suppliers",
    shortcut: "Ctrl+U",
    description: "Suppliers",
    path: "/suppliers",
  },
];

export function normalizeShortcut(e: KeyboardEvent) {
  const keys: string[] = [];

  if (e.ctrlKey) keys.push("Ctrl");

  if (e.altKey) keys.push("Alt");

  if (e.shiftKey) keys.push("Shift");

  if (e.metaKey) keys.push("Meta");

  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;

  keys.push(key);

  return keys.join("+");
}
