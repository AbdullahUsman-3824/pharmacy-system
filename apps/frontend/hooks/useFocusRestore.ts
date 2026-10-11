"use client";

import { useCallback, useEffect, useRef } from "react";
import { getActiveElement, safeFocus } from "@/lib/keyboard/focusUtils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseFocusRestoreOptions {
  /**
   * When `true` (default), calling `restore()` automatically clears the
   * stored element so a second call is a no-op.
   */
  clearOnRestore?: boolean;

  /**
   * Delay in milliseconds before restoring focus.
   *
   * A small delay (default: one rAF via `requestAnimationFrame`) lets the
   * triggering component finish unmounting before focus moves, preventing the
   * browser from immediately re-blurring the restored element.
   *
   * Pass `0` for synchronous restoration.
   */
  delay?: number;
}

export interface UseFocusRestoreReturn {
  /**
   * Snapshot the currently focused element so it can be restored later.
   *
   * Call this just before opening a modal, popover, or any overlay that
   * will steal focus. If no element is currently focused, nothing is stored.
   */
  capture: () => void;

  /**
   * Return focus to the element captured by the last `capture()` call.
   *
   * Safe to call even if nothing was captured — it becomes a no-op.
   */
  restore: () => void;

  /**
   * Discard the stored element without restoring focus.
   */
  clear: () => void;

  /**
   * Read the currently captured element (useful for debugging or conditional
   * logic — e.g. deciding whether to restore based on what was focused).
   */
  captured: HTMLElement | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Capture and restore the focused element around a transient overlay (modal,
 * popover, drawer, tooltip, etc.).
 *
 * ### Typical usage
 * ```tsx
 * function TriggerButton() {
 *   const [open, setOpen] = useState(false);
 *   const { capture, restore } = useFocusRestore();
 *
 *   const handleOpen = () => {
 *     capture();          // remember the button
 *     setOpen(true);
 *   };
 *
 *   const handleClose = () => {
 *     setOpen(false);
 *     restore();          // focus returns to the button
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleOpen}>Open Dialog</button>
 *       <Dialog open={open} onClose={handleClose} />
 *     </>
 *   );
 * }
 * ```
 *
 * ### Auto-capture on mount
 * If you want to capture focus automatically when a component mounts (without
 * calling `capture()` manually), pass the optional `autoCaptureOnMount` flag:
 *
 * ```tsx
 * // Inside the modal itself:
 * const { restore } = useFocusRestore({ autoCaptureOnMount: true });
 * useEffect(() => { return () => restore(); }, [restore]);
 * ```
 *
 * @param options  Behaviour options (see {@link UseFocusRestoreOptions}).
 * @param autoCaptureOnMount  When `true`, calls `capture()` on mount. Use
 *                            when the hook lives inside the overlay rather
 *                            than the trigger. Defaults to `false`.
 */
export function useFocusRestore(
  options: UseFocusRestoreOptions & { autoCaptureOnMount?: boolean } = {},
): UseFocusRestoreReturn {
  const { clearOnRestore = true, delay, autoCaptureOnMount = false } = options;

  const capturedRef = useRef<HTMLElement | null>(null);

  // Keep a stable object reference so callers can destructure without
  // worrying about stale closures.
  const capture = useCallback(() => {
    capturedRef.current = getActiveElement();
  }, []);

  const clear = useCallback(() => {
    capturedRef.current = null;
  }, []);

  const restore = useCallback(() => {
    const target = capturedRef.current;
    if (!target) return;

    if (clearOnRestore) {
      capturedRef.current = null;
    }

    if (delay === 0) {
      safeFocus(target);
    } else {
      // Default: one rAF — enough for the overlay to finish unmounting.
      requestAnimationFrame(() => safeFocus(target));
    }
  }, [clearOnRestore, delay]);

  // Auto-capture on mount when requested.
  useEffect(() => {
    if (autoCaptureOnMount) capture();
    // No cleanup — the caller decides when to restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only on mount

  return {
    capture,
    restore,
    clear,
    get captured() {
      return capturedRef.current;
    },
  };
}

// ---------------------------------------------------------------------------
// Convenience: combined open/close helper
// ---------------------------------------------------------------------------

/**
 * A simpler API that ties capture/restore directly to an `isOpen` boolean.
 *
 * - When `isOpen` flips `false → true`: captures current focus.
 * - When `isOpen` flips `true → false`: restores focus.
 *
 * Use this when you can't (or don't want to) call `capture/restore` manually.
 *
 * ```tsx
 * useFocusRestoreOnToggle(isModalOpen);
 * ```
 */
export function useFocusRestoreOnToggle(
  isOpen: boolean,
  options: UseFocusRestoreOptions = {},
): void {
  const { capture, restore } = useFocusRestore(options);
  const prevOpenRef = useRef(isOpen);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = isOpen;

    if (!wasOpen && isOpen) {
      capture();
    } else if (wasOpen && !isOpen) {
      restore();
    }
  }, [isOpen, capture, restore]);
}
