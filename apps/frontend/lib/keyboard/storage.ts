import type { KeyCombo, ShortcutAction, ShortcutBinding, ShortcutContext } from "./types";
import { defaultBindings } from "./defaults";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "pharmacy-pos:shortcut-overrides";

/**
 * Version stamp — increment when the override schema changes in a
 * breaking way so stale stored data is automatically discarded.
 */
const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Stored shape
// ---------------------------------------------------------------------------

/**
 * A single persisted override: just the keys array + context.
 * We deliberately don't store the full ShortcutBinding here — label,
 * description, global, preventDefault are always inherited from defaults
 * and only the key combos are user-configurable.
 */
export interface StoredOverride {
  action: ShortcutAction;
  context: ShortcutContext;
  keys: [KeyCombo, ...KeyCombo[]];
}

/** Shape written to localStorage. */
interface PersistedStore {
  version: number;
  overrides: StoredOverride[];
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isKeyCombo(v: unknown): v is KeyCombo {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.key !== "string" || o.key.length === 0) return false;
  for (const flag of ["ctrl", "alt", "shift", "meta"] as const) {
    if (o[flag] !== undefined && typeof o[flag] !== "boolean") return false;
  }
  return true;
}

function isStoredOverride(v: unknown): v is StoredOverride {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.action !== "string") return false;
  if (typeof o.context !== "string") return false;
  if (!Array.isArray(o.keys) || o.keys.length === 0) return false;
  return (o.keys as unknown[]).every(isKeyCombo);
}

// ---------------------------------------------------------------------------
// Core storage helpers
// ---------------------------------------------------------------------------

/**
 * Load all user overrides from localStorage.
 *
 * - Returns an empty array on any parse/validation failure (fail-safe).
 * - Silently discards data from a different schema version.
 * - Safe to call server-side — returns `[]` when `window` is unavailable.
 */
export function loadOverrides(): StoredOverride[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return [];

    const store = parsed as Record<string, unknown>;
    if (store.version !== SCHEMA_VERSION) return []; // version mismatch → discard

    if (!Array.isArray(store.overrides)) return [];

    return (store.overrides as unknown[]).filter(isStoredOverride);
  } catch {
    return [];
  }
}

/**
 * Persist all current overrides to localStorage.
 *
 * A no-op when `window` is unavailable (SSR).
 */
export function saveOverrides(overrides: StoredOverride[]): void {
  if (typeof window === "undefined") return;

  try {
    const store: PersistedStore = { version: SCHEMA_VERSION, overrides };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage may be unavailable (private browsing quota, etc.) — ignore.
  }
}

/**
 * Add or replace a single override and immediately persist.
 *
 * @param current  The current in-memory override list.
 * @param override The new override to upsert.
 * @returns        The updated list (new array — does not mutate `current`).
 */
export function upsertOverride(
  current: StoredOverride[],
  override: StoredOverride,
): StoredOverride[] {
  const next = current.filter(
    (o) => !(o.action === override.action && o.context === override.context),
  );
  next.push(override);
  saveOverrides(next);
  return next;
}

/**
 * Remove the override for a specific action+context and immediately persist.
 *
 * @returns The updated list.
 */
export function removeOverride(
  current: StoredOverride[],
  action: ShortcutAction,
  context: ShortcutContext,
): StoredOverride[] {
  const next = current.filter(
    (o) => !(o.action === action && o.context === context),
  );
  saveOverrides(next);
  return next;
}

/**
 * Clear all user overrides from localStorage and return an empty list.
 */
export function clearOverrides(): StoredOverride[] {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Merge helper — used by KeyboardProvider
// ---------------------------------------------------------------------------

/**
 * Produce the final binding list by starting from `defaults` and applying
 * each stored override on top.
 *
 * Matching is by `action + context`. Overridden bindings inherit all fields
 * from the default (global, preventDefault, description) and only replace
 * the `keys` array.
 *
 * Overrides whose action+context don't exist in `defaults` are appended as
 * new bindings so custom additions are also supported.
 */
export function mergeWithDefaults(
  defaults: ShortcutBinding[],
  overrides: StoredOverride[],
): ShortcutBinding[] {
  if (overrides.length === 0) return defaults;

  // Build a lookup: "action:context" → override
  const overrideMap = new Map<string, StoredOverride>();
  for (const o of overrides) {
    overrideMap.set(`${o.action}:${o.context}`, o);
  }

  const result: ShortcutBinding[] = defaults.map((binding) => {
    const ctx = binding.context ?? "global";
    const key = `${binding.action}:${ctx}`;
    const override = overrideMap.get(key);
    if (!override) return binding;

    // Apply override — keys replaced, everything else preserved.
    return { ...binding, keys: override.keys };
  });

  // Append any overrides that had no matching default (user additions).
  for (const [key, override] of overrideMap) {
    const alreadyHandled = defaults.some(
      (b) => `${b.action}:${b.context ?? "global"}` === key,
    );
    if (!alreadyHandled) {
      result.push({
        action: override.action,
        keys: override.keys,
        context: override.context,
        preventDefault: true,
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Convenience: default keys for an action+context
// ---------------------------------------------------------------------------

/**
 * Look up the default keys for an action+context from `defaultBindings`.
 * Returns `undefined` when the action has no default.
 */
export function getDefaultKeys(
  action: ShortcutAction,
  context: ShortcutContext,
): [KeyCombo, ...KeyCombo[]] | undefined {
  const binding = defaultBindings.find(
    (b) => b.action === action && (b.context ?? "global") === context,
  );
  return binding?.keys;
}
