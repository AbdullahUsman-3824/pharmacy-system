import type { ShortcutBinding } from "./types";

/**
 * Default key bindings for the Pharmacy POS.
 *
 * Design decisions:
 *  - Ctrl+letter bindings are registered as `global: false` (won't fire while
 *    the user is typing in an <input>/<textarea>), except for `commandPalette`
 *    and `help` which are truly global.
 *  - Alt+1..9 module shortcuts are always global — pressing them from anywhere
 *    jumps to the corresponding top-level module.
 *  - `preventDefault` is set for every combo that has a browser built-in
 *    (Ctrl+P opens print dialog, Ctrl+F opens Find bar, Ctrl+S saves the
 *    page, Ctrl+D bookmarks, Ctrl+N opens a new window, etc.).
 *  - Escape has `global: true` because it must dismiss modals / cancel forms
 *    even when focus is inside an input.
 */
export const defaultBindings: ShortcutBinding[] = [
  // ── CRUD ─────────────────────────────────────────────────────────────────

  {
    action: "new",
    keys: [{ key: "n", ctrl: true }],
    context: "global",
    preventDefault: true, // prevents browser "new window"
    description: "Create a new record.",
  },
  {
    action: "save",
    keys: [{ key: "s", ctrl: true }],
    context: "form",
    preventDefault: true, // prevents browser "save page"
    description: "Save the current form.",
  },
  {
    action: "edit",
    keys: [{ key: "e", ctrl: true }],
    context: "global",
    preventDefault: true,
    description: "Edit the selected record.",
  },
  {
    action: "delete",
    keys: [{ key: "d", ctrl: true }],
    context: "global",
    preventDefault: true, // prevents browser "bookmark page"
    description: "Delete the selected record.",
  },
  {
    action: "duplicate",
    keys: [{ key: "d", ctrl: true, shift: true }],
    context: "global",
    preventDefault: true,
    description: "Duplicate the selected record.",
  },

  // ── Search / Filter ───────────────────────────────────────────────────────

  {
    action: "search",
    keys: [{ key: "f", ctrl: true }],
    context: "global",
    preventDefault: true, // prevents browser "find in page"
    description: "Focus the search field.",
  },
  {
    action: "focusSearchBar",
    keys: [{ key: "/", ctrl: false }],
    context: "global",
    preventDefault: true, // prevents quick-find in Firefox
    description: "Focus the product search bar.",
  },

  // ── Printing ──────────────────────────────────────────────────────────────

  {
    action: "print",
    keys: [{ key: "p", ctrl: true }],
    context: "global",
    preventDefault: true, // prevents browser "print page"
    description: "Print the current view.",
  },
  {
    action: "printReceipt",
    keys: [{ key: "p", ctrl: true, shift: true }],
    context: "global",
    preventDefault: true,
    description: "Print the receipt for the current sale.",
  },

  // ── Interface ─────────────────────────────────────────────────────────────

  {
    action: "commandPalette",
    keys: [
      { key: "k", ctrl: true },
      { key: "p", ctrl: true, shift: true, alt: false }, // VS Code muscle memory
    ],
    context: "global",
    global: true, // fires even from inside inputs
    preventDefault: true,
    description: "Open the command palette.",
  },
  {
    action: "help",
    keys: [{ key: "F1" }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Open the keyboard shortcuts help overlay.",
  },
  {
    action: "cancel",
    keys: [{ key: "Escape" }],
    context: "global",
    global: true, // must work inside inputs to dismiss search
    preventDefault: false, // Esc has no browser default to suppress
    description: "Discard changes and close the current view.",
  },
  {
    action: "closeModal",
    keys: [{ key: "Escape" }],
    context: "modal",
    global: true,
    preventDefault: false,
    description: "Close the currently open modal.",
  },
  {
    action: "confirm",
    keys: [{ key: "Enter", ctrl: true }],
    context: "form",
    global: true,
    preventDefault: true,
    description: "Confirm / submit the current form.",
  },
  {
    action: "toggleSidebar",
    keys: [{ key: "b", ctrl: true }],
    context: "global",
    preventDefault: true,
    description: "Show or hide the navigation sidebar.",
  },

  // ── Sale ──────────────────────────────────────────────────────────────────

  {
    action: "newSale",
    keys: [{ key: "F2" }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Start a new sale transaction.",
  },
  {
    action: "holdSale",
    keys: [{ key: "F3" }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Put the current sale on hold.",
  },
  {
    action: "voidSale",
    keys: [{ key: "F4" }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Void the current sale.",
  },
  {
    action: "addItem",
    keys: [{ key: "Insert" }],
    context: "table",
    preventDefault: true,
    description: "Add an item to the sale.",
  },
  {
    action: "removeItem",
    keys: [{ key: "Delete" }],
    context: "table",
    preventDefault: true,
    description: "Remove the selected item from the sale.",
  },
  {
    action: "applyDiscount",
    keys: [{ key: "F6" }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Apply a discount to the current item or sale.",
  },
  {
    action: "openCashDrawer",
    keys: [{ key: "F8" }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Open the cash drawer.",
  },
  {
    action: "switchPaymentMethod",
    keys: [{ key: "F9" }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Cycle to the next payment method.",
  },
  {
    action: "focusQuantityField",
    keys: [{ key: "q", alt: true }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Move focus to the quantity field.",
  },

  // ── Navigation ────────────────────────────────────────────────────────────

  {
    action: "nextItem",
    keys: [{ key: "ArrowDown" }],
    context: "table",
    preventDefault: true,
    description: "Move to the next row in the table.",
  },
  {
    action: "prevItem",
    keys: [{ key: "ArrowUp" }],
    context: "table",
    preventDefault: true,
    description: "Move to the previous row in the table.",
  },
  {
    action: "nextPage",
    keys: [
      { key: "ArrowRight", ctrl: true },
      { key: "PageDown" },
    ],
    context: "table",
    preventDefault: true,
    description: "Go to the next page of results.",
  },
  {
    action: "prevPage",
    keys: [
      { key: "ArrowLeft", ctrl: true },
      { key: "PageUp" },
    ],
    context: "table",
    preventDefault: true,
    description: "Go to the previous page of results.",
  },
  {
    action: "goToTop",
    keys: [{ key: "Home", ctrl: true }],
    context: "table",
    preventDefault: true,
    description: "Jump to the first row.",
  },
  {
    action: "goToBottom",
    keys: [{ key: "End", ctrl: true }],
    context: "table",
    preventDefault: true,
    description: "Jump to the last row.",
  },

  // ── Alt+1..9 — Module shortcuts (placeholders) ────────────────────────────
  // Each slot maps to a top-level module. Wire these to actual route actions
  // in the routing layer; the action name is a placeholder convention.
  // They all set global: true so they work from any focused element.

  {
    action: "newSale",       // Alt+1 → POS / Sale screen
    keys: [{ key: "1", alt: true }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Go to Sale / POS screen (Alt+1).",
  },
  {
    action: "search",        // Alt+2 → Inventory / Products
    keys: [{ key: "2", alt: true }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Go to Inventory / Products (Alt+2).",
  },
  {
    action: "new",           // Alt+3 → Purchases / Receiving
    keys: [{ key: "3", alt: true }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Go to Purchases / Receiving (Alt+3).",
  },
  {
    action: "search",        // Alt+4 → Customers
    keys: [{ key: "4", alt: true }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Go to Customers (Alt+4).",
  },
  {
    action: "search",        // Alt+5 → Distributors / Suppliers
    keys: [{ key: "5", alt: true }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Go to Distributors (Alt+5).",
  },
  {
    action: "search",        // Alt+6 → Reports
    keys: [{ key: "6", alt: true }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Go to Reports (Alt+6).",
  },
  {
    action: "search",        // Alt+7 → Accounts / Finance
    keys: [{ key: "7", alt: true }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Go to Accounts (Alt+7).",
  },
  {
    action: "search",        // Alt+8 → Settings
    keys: [{ key: "8", alt: true }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Go to Settings (Alt+8).",
  },
  {
    action: "help",          // Alt+9 → Help / About
    keys: [{ key: "9", alt: true }],
    context: "global",
    global: true,
    preventDefault: true,
    description: "Go to Help / About (Alt+9).",
  },
];
