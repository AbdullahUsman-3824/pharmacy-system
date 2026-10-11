import type { KeyCombo, ShortcutAction, ShortcutBinding, ShortcutContext } from "./types";
import { matchesKeyCombo } from "./parser";

// ---------------------------------------------------------------------------
// Context priority
// ---------------------------------------------------------------------------

/**
 * Defines how specific each context is.
 * Higher number = higher priority. When the same action is bound in multiple
 * active contexts the binding with the highest priority wins.
 *
 *   modal  (3)  >  form / table  (2)  >  input  (1)  >  global  (0)
 */
export const CONTEXT_PRIORITY: Record<ShortcutContext, number> = {
  global: 0,
  input: 1,
  table: 2,
  form: 2,
  modal: 3,
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Stable string key for a KeyCombo, used for de-dup checks. */
function comboKey(c: KeyCombo): string {
  return [
    c.ctrl ? "C" : "_",
    c.alt ? "A" : "_",
    c.shift ? "S" : "_",
    c.meta ? "M" : "_",
    c.key.toLowerCase(),
  ].join(":");
}

// ---------------------------------------------------------------------------
// ShortcutRegistry
// ---------------------------------------------------------------------------

/**
 * In-memory store for {@link ShortcutBinding}s.
 *
 * Responsibilities:
 *  - Hold the full set of registered bindings.
 *  - Answer queries: "which binding fires for this event given these active
 *    contexts?" and "what binding owns this action?".
 *  - Allow runtime overrides (user-customisable shortcuts).
 *
 * Not a singleton — create one instance per KeyboardManager.
 */
export class ShortcutRegistry {
  /** Ordered list of registered bindings. Last-registered wins on duplicate
   *  combos within the same context (mirrors CSS cascade logic). */
  private bindings: ShortcutBinding[] = [];

  // ── Registration ──────────────────────────────────────────────────────────

  /**
   * Add a binding to the registry.
   *
   * If a binding with the **exact same action + context** already exists it is
   * replaced, so calling `register` is idempotent for the same logical slot.
   * To add a second binding for the same action in a different context, pass a
   * different `context` value.
   */
  register(binding: ShortcutBinding): void {
    const context = binding.context ?? "global";
    const idx = this.bindings.findIndex(
      (b) => b.action === binding.action && (b.context ?? "global") === context,
    );

    const normalised: ShortcutBinding = { ...binding, context };

    if (idx !== -1) {
      this.bindings[idx] = normalised;
    } else {
      this.bindings.push(normalised);
    }
  }

  /**
   * Register multiple bindings at once. Useful for loading `defaultBindings`.
   */
  registerAll(bindings: ShortcutBinding[]): void {
    for (const b of bindings) {
      this.register(b);
    }
  }

  // ── Unregistration ────────────────────────────────────────────────────────

  /**
   * Remove the binding for a specific action.
   *
   * @param action   The action to remove.
   * @param context  If provided, only the binding in that context is removed.
   *                 If omitted, **all** bindings for the action are removed.
   */
  unregister(action: ShortcutAction, context?: ShortcutContext): void {
    this.bindings = this.bindings.filter((b) => {
      if (b.action !== action) return true;
      if (context === undefined) return false; // remove all
      return (b.context ?? "global") !== context;
    });
  }

  /**
   * Remove every binding whose context matches.
   * Handy for tearing down page-level bindings on route change.
   */
  unregisterContext(context: ShortcutContext): void {
    this.bindings = this.bindings.filter(
      (b) => (b.context ?? "global") !== context,
    );
  }

  /** Remove all registered bindings. */
  clear(): void {
    this.bindings = [];
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /**
   * Return all registered bindings, optionally filtered to a single context.
   *
   * The returned array is a shallow copy — mutating it does not affect the
   * registry.
   */
  getBindings(context?: ShortcutContext): ShortcutBinding[] {
    if (context === undefined) return [...this.bindings];
    return this.bindings.filter((b) => (b.context ?? "global") === context);
  }

  /**
   * Return the highest-priority binding for a given action across all
   * currently active contexts.
   *
   * @param action         The action to look up.
   * @param activeContexts The set of contexts currently active in the UI.
   *                       Defaults to `["global"]` if omitted.
   */
  getBindingForAction(
    action: ShortcutAction,
    activeContexts: ShortcutContext[] = ["global"],
  ): ShortcutBinding | undefined {
    const contextSet = new Set(activeContexts);

    const candidates = this.bindings.filter(
      (b) =>
        b.action === action && contextSet.has(b.context ?? "global"),
    );

    if (candidates.length === 0) return undefined;

    // Highest CONTEXT_PRIORITY wins; ties broken by last-registered (highest idx).
    return candidates.reduce((best, current) => {
      const bestPriority = CONTEXT_PRIORITY[best.context ?? "global"];
      const currentPriority = CONTEXT_PRIORITY[current.context ?? "global"];
      return currentPriority >= bestPriority ? current : best;
    });
  }

  /**
   * Given a raw {@link KeyboardEvent} and a set of active contexts, find the
   * binding whose key combo matches and return the corresponding action.
   *
   * Resolution order:
   *  1. Filter to bindings whose context is in `activeContexts`.
   *  2. Check each binding's key combos against the event.
   *  3. Among matches, return the action of the highest-priority binding.
   *     Ties are broken in favour of the most recently registered binding.
   *
   * Returns `null` when no binding matches.
   */
  getActionForEvent(
    event: KeyboardEvent,
    activeContexts: ShortcutContext[] = ["global"],
  ): ShortcutBinding | null {
    const contextSet = new Set(activeContexts);

    let best: ShortcutBinding | null = null;
    let bestPriority = -1;

    for (const binding of this.bindings) {
      const ctx = binding.context ?? "global";
      if (!contextSet.has(ctx)) continue;

      const matches = binding.keys.some((combo) =>
        matchesKeyCombo(event, combo),
      );
      if (!matches) continue;

      const priority = CONTEXT_PRIORITY[ctx];
      if (priority >= bestPriority) {
        best = binding;
        bestPriority = priority;
      }
    }

    return best;
  }

  // ── Introspection ─────────────────────────────────────────────────────────

  /**
   * Return `true` if the registry already has a binding for the given combo
   * in the given context. Useful for conflict detection in a settings UI.
   */
  hasConflict(
    combo: KeyCombo,
    context: ShortcutContext,
    excludeAction?: ShortcutAction,
  ): boolean {
    const key = comboKey(combo);
    return this.bindings.some((b) => {
      if (excludeAction && b.action === excludeAction) return false;
      if ((b.context ?? "global") !== context) return false;
      return b.keys.some((k) => comboKey(k) === key);
    });
  }

  /** Total number of bindings currently registered. */
  get size(): number {
    return this.bindings.length;
  }

  /**
   * Snapshot of all bindings, serialisable to JSON.
   * Useful for persisting user customisations to localStorage.
   */
  toJSON(): ShortcutBinding[] {
    return structuredClone(this.bindings);
  }
}
