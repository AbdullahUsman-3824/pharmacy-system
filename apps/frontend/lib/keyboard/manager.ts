"use client";

import type { ShortcutAction, ShortcutBinding, ShortcutContext } from "./types";
import { ShortcutRegistry } from "./registry";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Handler called when an action fires. Receives the original event so the
 *  handler can inspect it or call stopPropagation if needed. */
export type ActionHandler = (action: ShortcutAction, event: KeyboardEvent) => void;

/** Options accepted by the KeyboardManager constructor. */
export interface KeyboardManagerOptions {
  /**
   * Initial bindings to load into the registry on construction.
   * Typically pass `defaultBindings` here.
   */
  bindings?: ShortcutBinding[];

  /**
   * Called whenever a registered shortcut fires.
   * A single global handler keeps the manager decoupled from React state;
   * swap it out via `setHandler()` after construction.
   */
  onAction?: ActionHandler;

  /**
   * When `false` the manager is constructed but does not attach its listener
   * until `enable()` is called. Defaults to `true`.
   */
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Input-guard helpers
// ---------------------------------------------------------------------------

/** Tags whose focused element should suppress non-global shortcuts. */
const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Return `true` when the currently focused element is an editable field.
 * Also catches contentEditable regions.
 */
function isFocusedOnInput(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  if (INPUT_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  return false;
}

// ---------------------------------------------------------------------------
// KeyboardManager
// ---------------------------------------------------------------------------

/**
 * Manages a single `keydown` listener on `window` and routes events to the
 * correct {@link ShortcutRegistry} binding.
 *
 * ### Lifecycle
 * ```
 * const manager = new KeyboardManager({ bindings: defaultBindings, onAction });
 * // manager is now listening (enabled by default)
 *
 * manager.setContext("modal");      // push a new active context
 * manager.removeContext("modal");   // pop it when the modal closes
 *
 * manager.disable();                // detach listener (e.g. during a dialog)
 * manager.enable();                 // re-attach
 *
 * manager.destroy();                // final cleanup — call in useEffect cleanup
 * ```
 *
 * ### Context stack
 * Contexts accumulate on a stack. The manager always passes ALL active
 * contexts to the registry, which then picks the highest-priority matching
 * binding. "global" is always included as the base.
 *
 * ### Input guarding
 * By default, shortcuts do NOT fire when focus is inside an `<input>`,
 * `<textarea>`, `<select>`, or a `contentEditable` element.
 * Individual bindings can opt out of this guard by setting `global: true`.
 *
 * ### Client-only
 * The class guards every `window` access so it is safe to import in a
 * Next.js module tree that runs on the server — the constructor simply
 * no-ops when `window` is undefined.
 */
export class KeyboardManager {
  readonly registry: ShortcutRegistry;

  private handler: ActionHandler | null;
  private _enabled: boolean;
  private contextStack: ShortcutContext[];
  private boundListener: (e: KeyboardEvent) => void;

  // ── Construction ──────────────────────────────────────────────────────────

  constructor(options: KeyboardManagerOptions = {}) {
    const { bindings = [], onAction, enabled = true } = options;

    this.registry = new ShortcutRegistry();
    this.handler = onAction ?? null;
    this._enabled = false; // will be set by enable() below
    this.contextStack = ["global"];

    // Pre-bind so we can add/remove the exact same function reference.
    this.boundListener = this.handleKeyDown.bind(this);

    if (bindings.length > 0) {
      this.registry.registerAll(bindings);
    }

    if (enabled) {
      this.enable();
    }
  }

  // ── Listener lifecycle ────────────────────────────────────────────────────

  /**
   * Attach the keydown listener to `window`.
   * Safe to call multiple times — attaches only once.
   */
  enable(): void {
    if (this._enabled) return;
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", this.boundListener, { capture: true });
    this._enabled = true;
  }

  /**
   * Detach the keydown listener from `window`.
   * The registry and context stack are preserved so `enable()` resumes where
   * it left off.
   */
  disable(): void {
    if (!this._enabled) return;
    if (typeof window === "undefined") return;

    window.removeEventListener("keydown", this.boundListener, { capture: true });
    this._enabled = false;
  }

  /**
   * Permanently tear down the manager.
   * Detaches the listener, clears the registry, and nulls internal state.
   * Call this in a `useEffect` cleanup or `componentWillUnmount`.
   */
  destroy(): void {
    this.disable();
    this.registry.clear();
    this.handler = null;
    this.contextStack = ["global"];
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  // ── Handler ───────────────────────────────────────────────────────────────

  /**
   * Replace the action handler at runtime.
   * Useful in React to always call the latest closure without re-registering
   * the window listener:
   *
   * ```ts
   * useEffect(() => { manager.setHandler(handleAction); }, [handleAction]);
   * ```
   */
  setHandler(handler: ActionHandler | null): void {
    this.handler = handler;
  }

  // ── Context management ────────────────────────────────────────────────────

  /**
   * Push a context onto the stack.
   *
   * Duplicates are silently ignored — the same context cannot appear twice.
   * "global" is always present as the base and cannot be pushed again.
   *
   * @example
   * manager.setContext("modal");  // stack: ["global", "modal"]
   */
  setContext(context: ShortcutContext): void {
    if (context === "global") return; // always present
    if (!this.contextStack.includes(context)) {
      this.contextStack.push(context);
    }
  }

  /**
   * Remove a context from the stack.
   * "global" can never be removed.
   *
   * @example
   * manager.removeContext("modal"); // stack: ["global"]
   */
  removeContext(context: ShortcutContext): void {
    if (context === "global") return;
    this.contextStack = this.contextStack.filter((c) => c !== context);
  }

  /**
   * Replace the entire context stack at once.
   * "global" is always injected as the base regardless of what you pass.
   */
  setContextStack(contexts: ShortcutContext[]): void {
    const withoutGlobal = contexts.filter((c) => c !== "global");
    this.contextStack = ["global", ...withoutGlobal];
  }

  /** Current read-only snapshot of the active context stack. */
  get activeContexts(): ShortcutContext[] {
    return [...this.contextStack];
  }

  // ── Core dispatch ─────────────────────────────────────────────────────────

  /**
   * The single `keydown` listener attached to `window`.
   *
   * Resolution algorithm:
   *  1. Skip pure modifier key presses (Ctrl alone, Shift alone, etc.).
   *  2. Ask the registry for the best matching binding given active contexts.
   *  3. If focus is in an input field, reject bindings that are not `global`.
   *  4. Call `preventDefault` when the binding requests it.
   *  5. Invoke the handler.
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // 1. Ignore bare modifier key presses — they never map to an action.
    if (isModifierOnly(event)) return;

    // 2. Resolve binding.
    const binding = this.registry.getActionForEvent(event, this.contextStack);
    if (!binding) return;

    // 3. Input guard — skip non-global shortcuts when typing.
    if (isFocusedOnInput(event) && !binding.global) return;

    // 4. Suppress browser default if requested.
    if (binding.preventDefault) {
      event.preventDefault();
    }

    // 5. Dispatch.
    if (this.handler) {
      this.handler(binding.action, event);
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Modifier key values — events fired by pressing only a modifier key. */
const MODIFIER_KEYS = new Set([
  "Control", "Shift", "Alt", "Meta",
  "CapsLock", "NumLock", "ScrollLock", "Fn",
]);

/** Return `true` when the event carries only a modifier key with no base key. */
function isModifierOnly(event: KeyboardEvent): boolean {
  return MODIFIER_KEYS.has(event.key);
}

// ---------------------------------------------------------------------------
// Module-level singleton factory
// ---------------------------------------------------------------------------

/**
 * Application-wide singleton instance.
 *
 * Import and use this in your root layout / provider so every part of the app
 * shares one listener.
 *
 * ```ts
 * // app/providers.tsx
 * import { getKeyboardManager } from "@/lib/keyboard/manager";
 * import { defaultBindings } from "@/lib/keyboard/defaults";
 *
 * const manager = getKeyboardManager({ bindings: defaultBindings });
 * ```
 *
 * The factory is lazy — the manager is created on first call and reused
 * thereafter. Safe to call from multiple modules.
 */
let _instance: KeyboardManager | null = null;

export function getKeyboardManager(
  options?: KeyboardManagerOptions,
): KeyboardManager {
  if (!_instance) {
    _instance = new KeyboardManager(options ?? { enabled: false });
  }
  return _instance;
}

/**
 * Destroy the singleton and clear the reference.
 * Only needed in tests or when you want a full reset.
 */
export function resetKeyboardManager(): void {
  _instance?.destroy();
  _instance = null;
}
