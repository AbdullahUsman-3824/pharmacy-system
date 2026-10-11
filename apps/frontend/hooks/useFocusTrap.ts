"use client";

import { useCallback, useEffect, useRef } from "react";
import { useKeyboard } from "@/components/providers/KeyboardProvider";
import {
  getActiveElement,
  getFocusable,
  getFirstFocusable,
  safeFocus,
} from "@/lib/keyboard/focusUtils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseFocusTrapOptions {
  /**
   * When `true` the trap is active. Tie this directly to the open state of
   * your modal/dialog so the trap engages and disengages automatically.
   *
   * Defaults to `true`.
   */
  enabled?: boolean;

  /**
   * Element (or a CSS selector relative to the container) to focus when the
   * trap first activates.
   *
   * Priority order:
   *   1. This option (when provided and resolvable)
   *   2. First element with `data-autofocus` inside the container
   *   3. First naturally focusable element inside the container
   *   4. The container itself (given a temporary `tabindex="-1"`)
   *
   * Pass `false` to suppress all automatic focusing on activation.
   */
  initialFocus?: HTMLElement | string | false;

  /**
   * When `true` (default), focus is returned to the element that was focused
   * before the trap activated, once the trap is deactivated.
   *
   * Set to `false` when you control focus restoration yourself
   * (e.g. the action that closed the modal moved focus elsewhere already).
   */
  returnFocus?: boolean;

  /**
   * When `true`, the `KeyboardManager` is paused while the trap is active so
   * application shortcuts don't fire inside a modal. Defaults to `true`.
   *
   * Set to `false` if the dialog itself registers shortcuts via `useShortcut`
   * and you want them to continue working.
   */
  pauseKeyboardManager?: boolean;
}

export interface UseFocusTrapReturn {
  /** Attach this ref to the container element that should trap focus. */
  containerRef: React.RefObject<HTMLElement | null>;

  /**
   * Manually deactivate and reactivate the trap from outside.
   * Useful when a nested dialog opens — deactivate the parent trap first.
   */
  deactivate: () => void;
  activate: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Trap keyboard focus inside a container element while a modal or dialog is
 * open. Restores focus to the previously focused element when the trap is
 * released.
 *
 * Integrates with `KeyboardManager` to pause global shortcuts while the trap
 * is active (prevents, e.g., Ctrl+N triggering "new record" while a
 * confirmation dialog is open).
 *
 * ### How it works
 * - A `keydown` listener in the **capture phase** intercepts Tab / Shift+Tab.
 * - When Tab would move focus outside the container, it wraps back to the
 *   first focusable element (or last, for Shift+Tab).
 * - Escape is intentionally NOT handled here — wire it via `useShortcut`
 *   with `{ context: "modal", global: true }` so it participates in the
 *   normal shortcut system.
 *
 * @example — used with Modal component
 * ```tsx
 * function ConfirmDialog({ open, onClose }) {
 *   const { containerRef } = useFocusTrap({ enabled: open });
 *   return (
 *     <Modal open={open} onClose={onClose}>
 *       <div ref={containerRef}>
 *         <p>Are you sure?</p>
 *         <button onClick={onClose}>Cancel</button>
 *         <button data-autofocus onClick={handleConfirm}>Confirm</button>
 *       </div>
 *     </Modal>
 *   );
 * }
 * ```
 *
 * @example — suppress automatic focus
 * ```tsx
 * const { containerRef } = useFocusTrap({ enabled: open, initialFocus: false });
 * ```
 *
 * @example — focus a specific element
 * ```tsx
 * const { containerRef } = useFocusTrap({ enabled: open, initialFocus: "#search-input" });
 * ```
 */
export function useFocusTrap({
  enabled = true,
  initialFocus,
  returnFocus = true,
  pauseKeyboardManager = true,
}: UseFocusTrapOptions = {}): UseFocusTrapReturn {
  const containerRef = useRef<HTMLElement | null>(null);

  // Snapshot of the element focused before the trap activated.
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Whether the trap is currently active (may differ from `enabled` during
  // manual activate/deactivate calls).
  const activeRef = useRef(false);

  // Stable ref to the latest `enabled` value so the keydown handler always
  // reads the current state without needing to re-register.
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  });

  // Access the KeyboardManager through context to pause/resume it.
  const { manager } = useKeyboard();

  // ---------------------------------------------------------------------------
  // Core trap logic
  // ---------------------------------------------------------------------------

  /**
   * Focus the initial element inside the container according to priority rules
   * described in the options above.
   */
  const focusInitialElement = useCallback(() => {
    if (initialFocus === false) return;

    const container = containerRef.current;
    if (!container) return;

    // 1. Explicit element / selector override.
    if (initialFocus) {
      if (initialFocus instanceof HTMLElement) {
        safeFocus(initialFocus);
        return;
      }
      if (typeof initialFocus === "string") {
        const el = container.querySelector<HTMLElement>(initialFocus);
        if (el) {
          safeFocus(el);
          return;
        }
      }
    }

    // 2. data-autofocus attribute.
    const autoFocusEl = container.querySelector<HTMLElement>("[data-autofocus]");
    if (autoFocusEl && getFocusable(container).includes(autoFocusEl)) {
      safeFocus(autoFocusEl);
      return;
    }

    // 3. First naturally focusable element.
    const first = getFirstFocusable(container);
    if (first) {
      safeFocus(first);
      return;
    }

    // 4. Container itself as last resort.
    if (!container.hasAttribute("tabindex")) {
      container.setAttribute("tabindex", "-1");
    }
    safeFocus(container);
  }, [initialFocus]);

  // ---------------------------------------------------------------------------
  // Tab key handler
  // ---------------------------------------------------------------------------

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!activeRef.current) return;
    if (event.key !== "Tab") return;

    const container = containerRef.current;
    if (!container) return;

    const focusable = getFocusable(container);
    if (focusable.length === 0) {
      // Nothing to Tab to — trap the key entirely.
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = getActiveElement();

    if (event.shiftKey) {
      // Shift+Tab: if focus is at (or outside) the first element, wrap to last.
      if (!active || active === first || !container.contains(active)) {
        event.preventDefault();
        safeFocus(last);
      }
    } else {
      // Tab: if focus is at (or outside) the last element, wrap to first.
      if (!active || active === last || !container.contains(active)) {
        event.preventDefault();
        safeFocus(first);
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Activate / deactivate
  // ---------------------------------------------------------------------------

  const activate = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;

    // Snapshot current focus for restoration.
    previousFocusRef.current = getActiveElement();

    // Pause global shortcuts so they don't fire inside the modal.
    if (pauseKeyboardManager) {
      manager.disable();
    }

    // Attach Tab trap in capture phase so it runs before any other handlers.
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    // Move focus into the container after a rAF to let the DOM settle
    // (portals may not have painted synchronously yet).
    requestAnimationFrame(focusInitialElement);
  }, [pauseKeyboardManager, manager, handleKeyDown, focusInitialElement]);

  const deactivate = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;

    window.removeEventListener("keydown", handleKeyDown, { capture: true });

    // Resume the keyboard manager.
    if (pauseKeyboardManager) {
      manager.enable();
    }

    // Restore focus to the element that was focused before the trap.
    if (returnFocus && previousFocusRef.current) {
      // rAF: let the modal finish unmounting before restoring focus, otherwise
      // some browsers re-focus the body immediately after.
      requestAnimationFrame(() => {
        safeFocus(previousFocusRef.current ?? undefined);
        previousFocusRef.current = null;
      });
    }
  }, [pauseKeyboardManager, manager, handleKeyDown, returnFocus]);

  // ---------------------------------------------------------------------------
  // Sync with `enabled` prop
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (enabled) {
      activate();
    } else {
      deactivate();
    }

    return () => {
      // Always clean up on unmount regardless of enabled state.
      deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  // ^ activate/deactivate are stable (useCallback with no changing deps),
  //   but we intentionally only re-run when `enabled` flips.

  return { containerRef, activate, deactivate };
}
