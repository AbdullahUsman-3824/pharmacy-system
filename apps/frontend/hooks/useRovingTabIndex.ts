"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { safeFocus } from "@/lib/keyboard/focusUtils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RovingOrientation = "vertical" | "horizontal" | "both";

export interface UseRovingTabIndexOptions {
  /**
   * Total number of items in the list/table.
   */
  itemCount: number;

  /**
   * Index of the item that should receive `tabindex="0"` when the list is
   * first rendered (i.e. the item that Tab lands on when entering the list).
   * Defaults to `0`.
   */
  initialIndex?: number;

  /**
   * Direction(s) of arrow-key navigation.
   *
   * - `"vertical"`   → ↑ / ↓  (default — suits lists and table rows)
   * - `"horizontal"` → ← / →  (suits toolbars and tab bars)
   * - `"both"`       → all four arrows (suits grids)
   */
  orientation?: RovingOrientation;

  /**
   * Number of columns per row, used only when `orientation` is `"both"`.
   * Ignored for `"vertical"` and `"horizontal"`.
   */
  columns?: number;

  /**
   * When `true`, arrow key navigation wraps from the last item back to the
   * first (and vice versa). Defaults to `true`.
   */
  wrap?: boolean;

  /**
   * When `true`, Home / End keys jump to the first / last item.
   * Defaults to `true`.
   */
  homeEnd?: boolean;

  /**
   * Called after the focused index changes, with the new index and the
   * `KeyboardEvent` that triggered the change.
   *
   * Use this to imperatively scroll the item into view, update selection
   * state, or fire analytics.
   */
  onNavigate?: (index: number, event: KeyboardEvent) => void;

  /**
   * When `true`, pressing Enter or Space on a focused item calls the item's
   * `onClick` handler (if `getItemProps` is used to attach it).
   *
   * Defaults to `false` — most interactive children (buttons, links) already
   * handle Enter/Space natively.
   */
  activateOnSpace?: boolean;
  activateOnEnter?: boolean;
}

export interface RovingItemProps {
  /** Set `tabindex="0"` for the focused item, `tabindex="-1"` for all others. */
  tabIndex: 0 | -1;
  /** Used by the hook to identify items in the DOM. */
  "data-roving-item": string;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  onFocus: (event: React.FocusEvent<HTMLElement>) => void;
  ref: (el: HTMLElement | null) => void;
}

export interface UseRovingTabIndexReturn {
  /** Index of the currently "roving" item (the one with `tabindex="0"`). */
  focusedIndex: number;

  /**
   * Programmatically move focus to a specific item.
   * Useful for "select all", mouse-click-then-arrow, etc.
   */
  setFocusedIndex: (index: number) => void;

  /**
   * Returns the props to spread onto each list item.
   *
   * ```tsx
   * {items.map((item, i) => (
   *   <li key={item.id} {...getItemProps(i)}>
   *     {item.label}
   *   </li>
   * ))}
   * ```
   */
  getItemProps: (index: number) => RovingItemProps;

  /**
   * Ref to attach to the list/table container element.
   * Used for programmatic focus calls.
   */
  containerRef: React.RefObject<HTMLElement | null>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Implement the [roving tabindex](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex)
 * pattern for keyboard-navigable lists, tables, toolbars, and grids.
 *
 * ### Pattern summary
 * - Only one item in the list has `tabindex="0"` at a time (the "roving" item).
 * - All other items have `tabindex="-1"`.
 * - Arrow keys move the roving tabindex and focus through the list.
 * - Tab key exits the list entirely (managed by the browser).
 * - Home / End jump to first / last item.
 *
 * ### Basic list usage
 * ```tsx
 * function ProductList({ products }) {
 *   const { getItemProps } = useRovingTabIndex({ itemCount: products.length });
 *
 *   return (
 *     <ul role="listbox">
 *       {products.map((p, i) => (
 *         <li key={p.id} role="option" {...getItemProps(i)}>
 *           {p.name}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 *
 * ### Table row usage (vertical navigation)
 * ```tsx
 * function SaleTable({ rows }) {
 *   const { getItemProps, focusedIndex } = useRovingTabIndex({
 *     itemCount: rows.length,
 *     orientation: "vertical",
 *     onNavigate: (i) => scrollRowIntoView(i),
 *   });
 *
 *   return (
 *     <table>
 *       <tbody>
 *         {rows.map((row, i) => (
 *           <tr key={row.id} {...getItemProps(i)}
 *               aria-selected={focusedIndex === i}>
 *             <td>{row.name}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   );
 * }
 * ```
 *
 * ### Toolbar (horizontal navigation)
 * ```tsx
 * const { getItemProps } = useRovingTabIndex({
 *   itemCount: buttons.length,
 *   orientation: "horizontal",
 *   wrap: false,
 * });
 * ```
 *
 * ### Grid (2D navigation)
 * ```tsx
 * const { getItemProps } = useRovingTabIndex({
 *   itemCount: cells.length,
 *   orientation: "both",
 *   columns: 4,
 * });
 * ```
 */
export function useRovingTabIndex({
  itemCount,
  initialIndex = 0,
  orientation = "vertical",
  columns = 1,
  wrap = true,
  homeEnd = true,
  onNavigate,
  activateOnSpace = false,
  activateOnEnter = false,
}: UseRovingTabIndexOptions): UseRovingTabIndexReturn {
  const [focusedIndex, setFocusedIndexState] = useState<number>(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, itemCount - 1)),
  );

  const containerRef = useRef<HTMLElement | null>(null);

  // Keep stable refs to avoid re-creating getItemProps on every render.
  const focusedIndexRef = useRef(focusedIndex);
  const itemCountRef = useRef(itemCount);
  const onNavigateRef = useRef(onNavigate);

  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  });
  useEffect(() => {
    itemCountRef.current = itemCount;
  });
  useEffect(() => {
    onNavigateRef.current = onNavigate;
  });

  // Per-item element refs, used for programmatic focus.
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  // ---------------------------------------------------------------------------
  // Clamp helper
  // ---------------------------------------------------------------------------

  const clamp = (idx: number) =>
    Math.min(Math.max(0, idx), itemCountRef.current - 1);

  // ---------------------------------------------------------------------------
  // Move focus
  // ---------------------------------------------------------------------------

  const moveTo = useCallback(
    (next: number, event: KeyboardEvent | ReactKeyboardEvent<HTMLElement>) => {
      const count = itemCountRef.current;
      if (count === 0) return;

      let target = next;
      if (wrap) {
        target = ((next % count) + count) % count; // proper modulo for negatives
      } else {
        target = clamp(next);
        if (target === focusedIndexRef.current) return; // already at boundary
      }

      setFocusedIndexState(target);
      focusedIndexRef.current = target;

      // Defer focus to next frame so state has been applied and the new item
      // has tabindex="0" before we call focus() on it.
      requestAnimationFrame(() => {
        const el = itemRefs.current.get(target);
        safeFocus(el);
      });

      onNavigateRef.current?.(target, event as KeyboardEvent);
    },
    [wrap],
  );

  // ---------------------------------------------------------------------------
  // Keyboard handler (shared across all items)
  // ---------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      const { key } = event;
      const current = focusedIndexRef.current;
      const count = itemCountRef.current;

      // Decide which keys to act on based on orientation.
      const isVertical = orientation === "vertical" || orientation === "both";
      const isHorizontal =
        orientation === "horizontal" || orientation === "both";
      const cols = orientation === "both" ? columns : 1;

      let handled = true;

      switch (key) {
        case "ArrowDown":
          if (!isVertical) {
            handled = false;
            break;
          }
          moveTo(current + cols, event);
          break;

        case "ArrowUp":
          if (!isVertical) {
            handled = false;
            break;
          }
          moveTo(current - cols, event);
          break;

        case "ArrowRight":
          if (!isHorizontal) {
            handled = false;
            break;
          }
          moveTo(current + 1, event);
          break;

        case "ArrowLeft":
          if (!isHorizontal) {
            handled = false;
            break;
          }
          moveTo(current - 1, event);
          break;

        case "Home":
          if (!homeEnd) {
            handled = false;
            break;
          }
          // Ctrl+Home → first item in grid; Home alone → first in row.
          if (orientation === "both" && event.ctrlKey) {
            moveTo(0, event);
          } else if (orientation === "both") {
            const rowStart = Math.floor(current / cols) * cols;
            moveTo(rowStart, event);
          } else {
            moveTo(0, event);
          }
          break;

        case "End":
          if (!homeEnd) {
            handled = false;
            break;
          }
          // Ctrl+End → last item in grid; End alone → last in row.
          if (orientation === "both" && event.ctrlKey) {
            moveTo(count - 1, event);
          } else if (orientation === "both") {
            const rowEnd = Math.min(
              Math.floor(current / cols) * cols + cols - 1,
              count - 1,
            );
            moveTo(rowEnd, event);
          } else {
            moveTo(count - 1, event);
          }
          break;

        case "PageUp":
          if (orientation !== "both") {
            handled = false;
            break;
          }
          // Move up one full page (number of rows visible — approximate as 5).
          moveTo(current - cols * 5, event);
          break;

        case "PageDown":
          if (orientation !== "both") {
            handled = false;
            break;
          }
          moveTo(current + cols * 5, event);
          break;

        case "Enter":
          if (!activateOnEnter) {
            handled = false;
            break;
          }
          // Click the focused item element.
          itemRefs.current.get(current)?.click();
          break;

        case " ":
          if (!activateOnSpace) {
            handled = false;
            break;
          }
          itemRefs.current.get(current)?.click();
          break;

        default:
          handled = false;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [orientation, columns, homeEnd, activateOnEnter, activateOnSpace, moveTo],
  );

  // ---------------------------------------------------------------------------
  // Focus sync: if an item is clicked directly, update focusedIndex to match.
  // ---------------------------------------------------------------------------

  const handleItemFocus = useCallback((index: number) => {
    if (index !== focusedIndexRef.current) {
      setFocusedIndexState(index);
      focusedIndexRef.current = index;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Clamp focusedIndex when itemCount shrinks.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (itemCount === 0) return;
    setFocusedIndexState((prev) => {
      const next = clamp(prev);
      focusedIndexRef.current = next;
      return next;
    });
  }, [itemCount]);

  // ---------------------------------------------------------------------------
  // Public setFocusedIndex (imperative, also moves DOM focus)
  // ---------------------------------------------------------------------------

  const setFocusedIndex = useCallback((index: number) => {
    const count = itemCountRef.current;
    if (count === 0) return;
    const target = clamp(index);
    setFocusedIndexState(target);
    focusedIndexRef.current = target;
    requestAnimationFrame(() => {
      safeFocus(itemRefs.current.get(target));
    });
  }, []);

  // ---------------------------------------------------------------------------
  // getItemProps
  // ---------------------------------------------------------------------------

  const getItemProps = useCallback(
    (index: number): RovingItemProps => ({
      tabIndex: index === focusedIndex ? 0 : -1,
      "data-roving-item": String(index),
      onKeyDown: handleKeyDown,
      onFocus: () => handleItemFocus(index),
      ref: (el: HTMLElement | null) => {
        if (el) {
          itemRefs.current.set(index, el);
        } else {
          itemRefs.current.delete(index);
        }
      },
    }),
    [focusedIndex, handleKeyDown, handleItemFocus],
  );

  // Expose as stable memoised value so spread props don't cause unnecessary
  // re-renders on siblings.
  const stableGetItemProps = useMemo(() => getItemProps, [getItemProps]);

  return {
    focusedIndex,
    setFocusedIndex,
    getItemProps: stableGetItemProps,
    containerRef,
  };
}
