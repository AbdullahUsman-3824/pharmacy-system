"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { defaultBindings } from "@/lib/keyboard/defaults";
import { KeyboardManager } from "@/lib/keyboard/manager";
import {
  clearOverrides,
  loadOverrides,
  mergeWithDefaults,
  removeOverride,
  upsertOverride,
  type StoredOverride,
} from "@/lib/keyboard/storage";
import type {
  KeyCombo,
  ShortcutAction,
  ShortcutBinding,
  ShortcutContext,
} from "@/lib/keyboard/types";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface KeyboardContextValue {
  /**
   * Register a handler for a specific action.
   * Returns an unregister function for cleanup.
   *
   * Multiple handlers for the same action all fire in registration order.
   */
  on: (
    action: ShortcutAction,
    handler: (event: KeyboardEvent) => void,
  ) => () => void;

  /** Push a context onto the manager's active stack. */
  setContext: (context: ShortcutContext) => void;

  /** Remove a previously pushed context. */
  removeContext: (context: ShortcutContext) => void;

  /** Register an additional binding at runtime. */
  registerBinding: (binding: ShortcutBinding) => void;

  /** Remove a runtime binding by action + context. */
  unregisterBinding: (
    action: ShortcutAction,
    context?: ShortcutContext,
  ) => void;

  // ── User override API ─────────────────────────────────────────────────────

  /**
   * Current user overrides — a stable reference that changes whenever an
   * override is saved or cleared. Use this to read the active override list
   * in settings UI components.
   */
  overrides: StoredOverride[];

  /**
   * Apply a user override for one action+context.
   *
   * - Persists to localStorage immediately.
   * - Re-registers the binding in the live registry so the new combo takes
   *   effect without a page reload.
   */
  applyOverride: (override: StoredOverride) => void;

  /**
   * Revert a single action+context back to its default keys.
   *
   * - Removes the stored override.
   * - Re-registers the default binding in the live registry.
   */
  resetOverride: (action: ShortcutAction, context: ShortcutContext) => void;

  /**
   * Remove ALL user overrides and restore every action to its default key.
   *
   * - Clears localStorage.
   * - Replaces the entire registry with the original defaultBindings.
   */
  resetAllOverrides: () => void;

  /** Convenience: look up the effective keys for a given action+context. */
  getKeysForAction: (
    action: ShortcutAction,
    context?: ShortcutContext,
  ) => [KeyCombo, ...KeyCombo[]] | undefined;

  /** Direct access to the underlying manager for advanced use cases. */
  manager: KeyboardManager;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function KeyboardProvider({ children }: { children: ReactNode }) {
  type HandlerSet = Set<(event: KeyboardEvent) => void>;

  // Stable mutable box for handlers — same object identity for the lifetime
  // of the provider. Not a ref, so it is safe to close over during init.
  const [handlerBox] = useState(() => ({
    map: new Map<ShortcutAction, HandlerSet>(),
  }));

  // Create the manager once. useState lazy init is the compiler-approved
  // replacement for "if (ref.current === null) ref.current = …".
  const [manager] = useState(() => {
    const storedOverrides = loadOverrides();
    const merged = mergeWithDefaults(defaultBindings, storedOverrides);

    return new KeyboardManager({
      bindings: merged,
      onAction: (action, event) => {
        const handlers = handlerBox.map.get(action);
        if (!handlers) return;
        for (const fn of handlers) fn(event);
      },
      enabled: false, // enabled after mount (window is available)
    });
  });

  // ── Override state ───────────────────────────────────────────────────────
  // Kept in React state so consumers re-render when overrides change.

  const [overrides, setOverrides] = useState<StoredOverride[]>(() =>
    loadOverrides(),
  );

  // ── Listener lifecycle ───────────────────────────────────────────────────

  useEffect(() => {
    manager.enable();
    return () => manager.disable();
  }, [manager]);

  // ── Core subscription API ────────────────────────────────────────────────

  const on = useCallback(
    (
      action: ShortcutAction,
      handler: (event: KeyboardEvent) => void,
    ): (() => void) => {
      const map = handlerBox.map;
      if (!map.has(action)) map.set(action, new Set());
      map.get(action)!.add(handler);
      return () => map.get(action)?.delete(handler);
    },
    [handlerBox],
  );

  const setContext = useCallback(
    (context: ShortcutContext) => {
      manager.setContext(context);
    },
    [manager],
  );

  const removeContext = useCallback(
    (context: ShortcutContext) => {
      manager.removeContext(context);
    },
    [manager],
  );

  const registerBinding = useCallback(
    (binding: ShortcutBinding) => {
      manager.registry.register(binding);
    },
    [manager],
  );

  const unregisterBinding = useCallback(
    (action: ShortcutAction, context?: ShortcutContext) => {
      manager.registry.unregister(action, context);
    },
    [manager],
  );

  // ── Override API ─────────────────────────────────────────────────────────

  const applyOverride = useCallback(
    (override: StoredOverride) => {
      // 1. Persist + update state.
      setOverrides((prev) => upsertOverride(prev, override));

      // 2. Re-register the binding live so the new combo fires immediately.
      const registry = manager.registry;

      // Find the existing binding to inherit all non-keys fields.
      const existing = registry
        .getBindings(override.context)
        .find((b) => b.action === override.action);

      const updated: ShortcutBinding = {
        ...(existing ?? { action: override.action }),
        action: override.action,
        keys: override.keys,
        context: override.context,
      };

      registry.register(updated);
    },
    [manager],
  );

  const resetOverride = useCallback(
    (action: ShortcutAction, context: ShortcutContext) => {
      // 1. Remove from storage + state.
      setOverrides((prev) => removeOverride(prev, action, context));

      // 2. Restore the default binding in the live registry.
      const registry = manager.registry;

      const defaultBinding = defaultBindings.find(
        (b) => b.action === action && (b.context ?? "global") === context,
      );
      if (defaultBinding) {
        registry.register(defaultBinding);
      }
    },
    [manager],
  );

  const resetAllOverrides = useCallback(() => {
    // 1. Clear storage + state.
    setOverrides(clearOverrides());

    // 2. Reload the registry entirely from defaults.
    const registry = manager.registry;
    registry.clear();
    registry.registerAll(defaultBindings);
  }, [manager]);

  const getKeysForAction = useCallback(
    (
      action: ShortcutAction,
      context: ShortcutContext = "global",
    ): [KeyCombo, ...KeyCombo[]] | undefined => {
      return manager.registry.getBindingForAction(action, [context, "global"])
        ?.keys;
    },
    [manager],
  );

  // ── Context value ────────────────────────────────────────────────────────
  // Memoised so consumers that only read `overrides` don't re-render when
  // the callbacks change (they never do — all are stable useCallback refs).

  const value = useMemo<KeyboardContextValue>(
    () => ({
      on,
      setContext,
      removeContext,
      registerBinding,
      unregisterBinding,
      overrides,
      applyOverride,
      resetOverride,
      resetAllOverrides,
      getKeysForAction,
      manager,
    }),
    // callbacks are all stable; only `overrides` triggers re-memos
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides],
  );

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

/**
 * Access the keyboard context. Must be inside `<KeyboardProvider>`.
 */
export function useKeyboard(): KeyboardContextValue {
  const ctx = useContext(KeyboardContext);
  if (!ctx) {
    throw new Error("useKeyboard must be used within a <KeyboardProvider>.");
  }
  return ctx;
}
