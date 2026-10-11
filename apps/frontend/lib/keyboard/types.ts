/**
 * All discrete actions that can be triggered via a keyboard shortcut.
 *
 * Naming convention: verb-first, camelCase.
 * Add new actions here — `actions.ts` must be kept in sync.
 */
export type ShortcutAction =
  // --- CRUD ---
  | "new"
  | "save"
  | "edit"
  | "delete"
  | "duplicate"
  // --- Navigation ---
  | "search"
  | "nextItem"
  | "prevItem"
  | "nextPage"
  | "prevPage"
  | "goToTop"
  | "goToBottom"
  // --- UI chrome ---
  | "commandPalette"
  | "help"
  | "cancel"
  | "confirm"
  | "toggleSidebar"
  | "closeModal"
  // --- POS-specific ---
  | "newSale"
  | "holdSale"
  | "voidSale"
  | "print"
  | "printReceipt"
  | "addItem"
  | "removeItem"
  | "applyDiscount"
  | "openCashDrawer"
  | "switchPaymentMethod"
  | "focusSearchBar"
  | "focusQuantityField";

// ---------------------------------------------------------------------------
// Key combination
// ---------------------------------------------------------------------------

/**
 * A single key combo such as `{ key: "s", ctrl: true }` → Ctrl+S.
 *
 * `key` follows the `KeyboardEvent.key` spec (e.g. "Enter", "Escape", "F1",
 * "a", "/"). Modifier flags default to false when absent.
 */
export interface KeyCombo {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  /** Meta key (⌘ on macOS / ⊞ on Windows). */
  meta?: boolean;
}

// ---------------------------------------------------------------------------
// Shortcut binding
// ---------------------------------------------------------------------------

/**
 * Links one or more key combos to a single `ShortcutAction` within a given
 * context. Providing multiple `keys` lets you register aliases (e.g. both
 * Ctrl+S and F2 for "save").
 */
export interface ShortcutBinding {
  action: ShortcutAction;
  /** At least one combo is required; extras act as aliases. */
  keys: [KeyCombo, ...KeyCombo[]];
  /** Scope in which this binding is active. Defaults to "global". */
  context?: ShortcutContext;
  /** When true, the default browser behaviour for this combo is suppressed. */
  preventDefault?: boolean;
  /** Human-readable description used in the help overlay / command palette. */
  description?: string;
  /**
   * When true, the shortcut fires even if focus is inside a text input or
   * textarea. Use sparingly — only for truly global actions like commandPalette.
   */
  global?: boolean;
}

// ---------------------------------------------------------------------------
// Shortcut context
// ---------------------------------------------------------------------------

/**
 * Represents the current "focus area" of the UI. The shortcut system uses
 * this to activate only the relevant subset of bindings.
 *
 * Hierarchy (from broadest to narrowest):
 *   global → table → form → input
 *                  → modal → form
 */
export type ShortcutContext = "global" | "form" | "table" | "modal" | "input";

// ---------------------------------------------------------------------------
// Action metadata
// ---------------------------------------------------------------------------

/**
 * Static metadata attached to every `ShortcutAction`.
 * Used for help overlays, command palettes, and display in the UI.
 */
export interface ActionMeta {
  action: ShortcutAction;
  /** Short human-readable label (title-case). */
  label: string;
  /** One-sentence description of what the action does. */
  description: string;
  /** Semantic category for grouping in help/command-palette UI. */
  category: ActionCategory;
}

export type ActionCategory =
  | "General"
  | "Navigation"
  | "Sale"
  | "Inventory"
  | "Printing"
  | "Interface";
