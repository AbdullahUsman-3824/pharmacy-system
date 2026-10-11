"use client";

import { useEffect, useRef } from "react";
import { useKeyboard } from "@/components/providers/KeyboardProvider";
import type { ShortcutAction, ShortcutBinding, ShortcutContext } from "@/lib/keyboard/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseShortcutOptions {
  /**
   * The context in which this shortcut is active.
   *
   * When provided, the hook pushes the context onto the manager stack on
   * mount and removes it on unmount — you don't need to call setContext /
   * removeContext manually.
   *
   * Omit (or pass `"global"`) for app-wide shortcuts.
   */
  context?: ShortcutContext;

  /**
   * When `true`, the shortcut fires even when focus is inside an input,
   * textarea, or contentEditable element.
   *
   * This only has effect if the binding was registered with `global: true`.
   * Defaults to `false`.
   */
  global?: boolean;

  /**
   * Additional key combos or binding overrides to register alongside the
   * action. Useful when you need a custom combo for this specific usage
   * rather than the default from `defaultBindings`.
   *
   * When provided, the binding is added to the registry on mount and removed
   * on unmount.
   */
  binding?: Omit<ShortcutBinding, "action">;

  /**
   * When `false`, the handler is registered but never called.
   * Useful for conditionally enabling shortcuts without unmounting.
   * Defaults to `true`.
   */
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// useShortcut
// ---------------------------------------------------------------------------

/**
 * Register a handler for a {@link ShortcutAction} inside a React component.
 *
 * The handler is automatically registered on mount and unregistered on
 * unmount. Changing `handler` between renders is safe — the hook always
 * calls the latest version without re-running the effect.
 *
 * @param action   The action to listen for.
 * @param handler  Callback invoked when the shortcut fires.
 * @param options  Optional context, enable/disable flag, and binding override.
 *
 * @example — simple global shortcut
 * ```tsx
 * useShortcut("save", () => form.submit());
 * ```
 *
 * @example — scoped to a modal, fires even from inputs
 * ```tsx
 * useShortcut("closeModal", () => onClose(), {
 *   context: "modal",
 *   global: true,
 * });
 * ```
 *
 * @example — conditionally enabled
 * ```tsx
 * useShortcut("delete", handleDelete, { enabled: !isReadOnly });
 * ```
 *
 * @example — custom binding override
 * ```tsx
 * useShortcut("print", handlePrint, {
 *   binding: {
 *     keys: [{ key: "F5" }],
 *     context: "table",
 *     preventDefault: true,
 *   },
 * });
 * ```
 */
export function useShortcut(
  action: ShortcutAction,
  handler: (event: KeyboardEvent) => void,
  options: UseShortcutOptions = {},
): void {
  const { context, binding, enabled = true } = options;
  const { on, setContext, removeContext, registerBinding, unregisterBinding } =
    useKeyboard();

  // Keep a stable ref to the latest handler so the effect never needs to
  // re-run when the handler closure changes between renders.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  // Stable enabled ref for the same reason.
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  });

  // ----- Context management ------------------------------------------------
  // Push/pop the requested context around this component's lifetime.

  useEffect(() => {
    if (!context || context === "global") return;

    setContext(context);
    return () => removeContext(context);
  }, [context, setContext, removeContext]);

  // ----- Optional binding registration ------------------------------------
  // Register a custom binding override when the caller provides one.

  useEffect(() => {
    if (!binding) return;

    const full: ShortcutBinding = { ...binding, action };
    registerBinding(full);

    return () => unregisterBinding(action, binding.context ?? context);
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [action]);
  // ^ intentionally omit binding/context/registerBinding/unregisterBinding —
  //   we only want to register once on mount and clean up on unmount.
  //   Callers should memoize the binding object if they need reactivity.

  // ----- Handler subscription ---------------------------------------------

  useEffect(() => {
    const unsubscribe = on(action, (event) => {
      if (!enabledRef.current) return;
      handlerRef.current(event);
    });

    return unsubscribe;
  }, [action, on]);
}

// ---------------------------------------------------------------------------
// useShortcuts (plural) — register multiple actions at once
// ---------------------------------------------------------------------------

export type ShortcutMap = Partial<
  Record<ShortcutAction, (event: KeyboardEvent) => void>
>;

/**
 * Register handlers for multiple actions in one call.
 *
 * All handlers share the same `options` (context, enabled flag).
 * Individual binding overrides are not supported here — use `useShortcut`
 * for those.
 *
 * @example
 * ```tsx
 * useShortcuts(
 *   {
 *     save:   () => form.submit(),
 *     cancel: () => router.back(),
 *     print:  handlePrint,
 *   },
 *   { context: "form" },
 * );
 * ```
 */
export function useShortcuts(
  map: ShortcutMap,
  options: Omit<UseShortcutOptions, "binding"> = {},
): void {
  const { on, setContext, removeContext } = useKeyboard();
  const { context, enabled = true } = options;

  // Stable refs — handlers and enabled flag may change every render.
  const mapRef = useRef(map);
  useEffect(() => {
    mapRef.current = map;
  });

  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  });

  // Context push/pop.
  useEffect(() => {
    if (!context || context === "global") return;
    setContext(context);
    return () => removeContext(context);
  }, [context, setContext, removeContext]);

  // Subscribe to every action present in the initial map.
  // We capture the action list once on mount — if the caller needs a
  // dynamic set of actions they should call useShortcut individually.
  useEffect(() => {
    const actions = Object.keys(mapRef.current) as ShortcutAction[];
    if (actions.length === 0) return;

    const unsubscribers = actions.map((action) =>
      on(action, (event) => {
        if (!enabledRef.current) return;
        mapRef.current[action]?.(event);
      }),
    );

    return () => {
      for (const unsub of unsubscribers) unsub();
    };
  }, [on]); // stable — `on` never changes
}
