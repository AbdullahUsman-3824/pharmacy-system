import type { ActionMeta, ShortcutAction } from "./types";

/**
 * Canonical metadata for every `ShortcutAction`.
 *
 * Rules:
 *  - Every value in the `ShortcutAction` union MUST have exactly one entry.
 *  - `label`   — title-case, ≤ 30 chars (used in buttons / palette items).
 *  - `description` — imperative sentence, ≤ 80 chars (used in help overlay).
 */
export const ACTION_META: Record<ShortcutAction, ActionMeta> = {
  // ── General ────────────────────────────────────────────────────────────────
  new: {
    action: "new",
    label: "New",
    description: "Create a new record or item.",
    category: "General",
  },
  save: {
    action: "save",
    label: "Save",
    description: "Save the current form or record.",
    category: "General",
  },
  edit: {
    action: "edit",
    label: "Edit",
    description: "Open the selected record for editing.",
    category: "General",
  },
  delete: {
    action: "delete",
    label: "Delete",
    description: "Delete the selected record.",
    category: "General",
  },
  duplicate: {
    action: "duplicate",
    label: "Duplicate",
    description: "Duplicate the selected record.",
    category: "General",
  },
  cancel: {
    action: "cancel",
    label: "Cancel",
    description: "Discard changes and close the current view.",
    category: "General",
  },
  confirm: {
    action: "confirm",
    label: "Confirm",
    description: "Confirm the current action or dialog.",
    category: "General",
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  search: {
    action: "search",
    label: "Search",
    description: "Focus the search field.",
    category: "Navigation",
  },
  nextItem: {
    action: "nextItem",
    label: "Next Item",
    description: "Move focus to the next item in a list or table.",
    category: "Navigation",
  },
  prevItem: {
    action: "prevItem",
    label: "Previous Item",
    description: "Move focus to the previous item in a list or table.",
    category: "Navigation",
  },
  nextPage: {
    action: "nextPage",
    label: "Next Page",
    description: "Navigate to the next page of results.",
    category: "Navigation",
  },
  prevPage: {
    action: "prevPage",
    label: "Previous Page",
    description: "Navigate to the previous page of results.",
    category: "Navigation",
  },
  goToTop: {
    action: "goToTop",
    label: "Go to Top",
    description: "Jump to the first item in a list or table.",
    category: "Navigation",
  },
  goToBottom: {
    action: "goToBottom",
    label: "Go to Bottom",
    description: "Jump to the last item in a list or table.",
    category: "Navigation",
  },

  // ── Sale ───────────────────────────────────────────────────────────────────
  newSale: {
    action: "newSale",
    label: "New Sale",
    description: "Start a new sale transaction.",
    category: "Sale",
  },
  holdSale: {
    action: "holdSale",
    label: "Hold Sale",
    description: "Put the current sale on hold.",
    category: "Sale",
  },
  voidSale: {
    action: "voidSale",
    label: "Void Sale",
    description: "Void / cancel the current sale transaction.",
    category: "Sale",
  },
  addItem: {
    action: "addItem",
    label: "Add Item",
    description: "Add an item to the current sale.",
    category: "Sale",
  },
  removeItem: {
    action: "removeItem",
    label: "Remove Item",
    description: "Remove the selected item from the current sale.",
    category: "Sale",
  },
  applyDiscount: {
    action: "applyDiscount",
    label: "Apply Discount",
    description: "Apply a discount to the current item or sale.",
    category: "Sale",
  },
  openCashDrawer: {
    action: "openCashDrawer",
    label: "Open Cash Drawer",
    description: "Trigger the cash drawer to open.",
    category: "Sale",
  },
  switchPaymentMethod: {
    action: "switchPaymentMethod",
    label: "Switch Payment Method",
    description: "Cycle through available payment methods.",
    category: "Sale",
  },
  focusSearchBar: {
    action: "focusSearchBar",
    label: "Focus Search Bar",
    description: "Move focus directly to the product search bar.",
    category: "Sale",
  },
  focusQuantityField: {
    action: "focusQuantityField",
    label: "Focus Quantity Field",
    description: "Move focus to the quantity input for the selected item.",
    category: "Sale",
  },

  // ── Inventory ──────────────────────────────────────────────────────────────
  // (Inventory-scoped actions share general new/save/edit/delete;
  //  add dedicated entries here when inventory-specific shortcuts are needed.)

  // ── Printing ───────────────────────────────────────────────────────────────
  print: {
    action: "print",
    label: "Print",
    description: "Print the current view or document.",
    category: "Printing",
  },
  printReceipt: {
    action: "printReceipt",
    label: "Print Receipt",
    description: "Print the receipt for the current or last sale.",
    category: "Printing",
  },

  // ── Interface ──────────────────────────────────────────────────────────────
  commandPalette: {
    action: "commandPalette",
    label: "Command Palette",
    description: "Open the command palette to search and run any action.",
    category: "Interface",
  },
  help: {
    action: "help",
    label: "Help / Shortcuts",
    description: "Open the keyboard shortcuts help overlay.",
    category: "Interface",
  },
  toggleSidebar: {
    action: "toggleSidebar",
    label: "Toggle Sidebar",
    description: "Show or hide the navigation sidebar.",
    category: "Interface",
  },
  closeModal: {
    action: "closeModal",
    label: "Close Modal",
    description: "Close the currently open modal or dialog.",
    category: "Interface",
  },
} as const;

/**
 * Flat array of all action metadata, useful for rendering help overlays
 * and populating a command palette.
 */
export const ACTION_META_LIST: ActionMeta[] = Object.values(ACTION_META);

/**
 * All supported shortcut action identifiers, derived directly from the
 * metadata map so this list is always in sync.
 */
export const SHORTCUT_ACTIONS = Object.keys(ACTION_META) as ShortcutAction[];
