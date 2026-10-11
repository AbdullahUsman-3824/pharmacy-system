"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useRovingTabIndex } from "@/hooks/useRovingTabIndex";
import type { RovingItemProps } from "@/hooks/useRovingTabIndex";
import { useKeyboard } from "@/components/providers/KeyboardProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseTableKeyNavOptions<T> {
  /** The data rows currently rendered in the table. */
  rows: T[];

  /**
   * Called when the user presses Enter on a focused row.
   * Typically used to open an edit form or detail view.
   */
  onEdit?: (row: T, index: number) => void;

  /**
   * Called when the user presses Delete / Backspace on a focused row.
   */
  onDelete?: (row: T, index: number) => void;

  /**
   * Called when PageDown is pressed and the table is paginated.
   * The hook does NOT manage pagination state — it delegates to the caller.
   */
  onNextPage?: () => void;

  /**
   * Called when PageUp is pressed.
   */
  onPrevPage?: () => void;

  /**
   * When `true`, the roving tabindex wraps from last row back to first.
   * Defaults to `false` for tables (reaching the end is a natural boundary).
   */
  wrap?: boolean;

  /**
   * When `true` (default), pressing Home / End jumps to the first / last row.
   */
  homeEnd?: boolean;

  /**
   * `data-*` attribute name used to mark the active row for CSS highlight.
   * The active row receives `data-[attr]="true"`, all others `data-[attr]="false"`.
   *
   * Defaults to `"active"` → `data-active="true"`.
   *
   * CSS target:
   * ```css
   * tr[data-active="true"] { background: var(--color-row-selected); }
   * ```
   */
  activeAttr?: string;

  /**
   * When `true`, the hook pushes the `"table"` ShortcutContext onto the
   * KeyboardManager stack on mount and removes it on unmount, activating
   * table-scoped bindings (↑ ↓ Delete etc.).
   *
   * Set to `false` if the parent already manages context.
   * Defaults to `true`.
   */
  manageContext?: boolean;
}

/** Props to spread onto each `<tr>` (or list item). */
export type TableRowNavProps = RovingItemProps & {
  /** `"true"` for the active row, `"false"` for all others. */
  "data-active": string;
};

export interface UseTableKeyNavReturn<T> {
  /** Index of the currently focused row. */
  activeIndex: number;

  /** Programmatically focus a specific row by index. */
  setActiveIndex: (index: number) => void;

  /**
   * Spread these props onto each table row element.
   *
   * ```tsx
   * {rows.map((row, i) => (
   *   <tr key={row.id} {...getRowProps(i)}>…</tr>
   * ))}
   * ```
   */
  getRowProps: (index: number) => TableRowNavProps;

  /**
   * Ref for the `<tbody>` (or container element).
   * Used for programmatic focus and scroll-into-view calls.
   */
  tbodyRef: RefObject<HTMLElement | null>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Full keyboard navigation behaviour for data tables.
 *
 * Builds on `useRovingTabIndex` and connects it to the app-wide
 * `KeyboardManager` so that arrow-key bindings defined in `defaults.ts`
 * (↑ ↓ PageUp PageDown Home End Delete) route through here automatically.
 *
 * ### Usage
 * ```tsx
 * function SaleItemsTable({ rows, onEdit, onDelete, onNextPage, onPrevPage }) {
 *   const { getRowProps, activeIndex, tbodyRef } = useTableKeyNav({
 *     rows,
 *     onEdit,
 *     onDelete,
 *     onNextPage,
 *     onPrevPage,
 *   });
 *
 *   return (
 *     <table>
 *       <tbody ref={tbodyRef}>
 *         {rows.map((row, i) => (
 *           <tr key={row.id} {...getRowProps(i)}>
 *             <td>{row.name}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   );
 * }
 * ```
 *
 * ### Active row highlight (CSS)
 * ```css
 * tr[data-active="true"] {
 *   background: var(--color-row-selected);
 *   outline: 1px solid var(--color-primary-border);
 * }
 * ```
 */
export function useTableKeyNav<T>({
  rows,
  onEdit,
  onDelete,
  onNextPage,
  onPrevPage,
  wrap = false,
  homeEnd = true,
  activeAttr = "active",
  manageContext = true,
}: UseTableKeyNavOptions<T>): UseTableKeyNavReturn<T> {
  const { setContext, removeContext } = useKeyboard();

  // Push the "table" context so table-scoped bindings activate.
  useEffect(() => {
    if (!manageContext) return;
    setContext("table");
    return () => removeContext("table");
  }, [manageContext, setContext, removeContext]);

  // Stable refs so callbacks always close over the latest handlers without
  // re-registering the keydown listener on every parent render.
  const onEditRef = useRef(onEdit);
  const onDeleteRef = useRef(onDelete);
  const onNextPageRef = useRef(onNextPage);
  const onPrevPageRef = useRef(onPrevPage);
  useEffect(() => {
    onEditRef.current = onEdit;
  }, [onEdit]);
  useEffect(() => {
    onDeleteRef.current = onDelete;
  }, [onDelete]);
  useEffect(() => {
    onNextPageRef.current = onNextPage;
  }, [onNextPage]);
  useEffect(() => {
    onPrevPageRef.current = onPrevPage;
  }, [onPrevPage]);

  // Scroll the newly focused row into view.
  const handleNavigate = useCallback(
    (_index: number, _event: KeyboardEvent) => {
      // rAF: state has already settled by the time this fires, but the DOM
      // element that received focus is the one that triggers scroll.
      requestAnimationFrame(() => {
        const active = document.querySelector(`[data-${activeAttr}="true"]`);
        active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    },
    [activeAttr],
  );

  const {
    focusedIndex,
    setFocusedIndex,
    getItemProps,
    containerRef: tbodyRef,
  } = useRovingTabIndex({
    itemCount: rows.length,
    orientation: "vertical",
    wrap,
    homeEnd,
    onNavigate: handleNavigate,
  });

  // Keep latest focusedIndex / rows in refs so the keydown listener can be
  // registered once and never needs to re-attach when those values change.
  const focusedIndexRef = useRef(focusedIndex);
  const rowsRef = useRef(rows);
  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts (Enter, Delete, PageUp, PageDown)
  // Attached once to the tbody via a stable listener; reads latest index/rows
  // from refs so we never re-subscribe on every navigation.
  // ---------------------------------------------------------------------------

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const index = focusedIndexRef.current;
    const currentRows = rowsRef.current;
    if (index < 0 || index >= currentRows.length) return;

    switch (e.key) {
      case "Enter": {
        e.preventDefault();
        e.stopPropagation();
        onEditRef.current?.(currentRows[index], index);
        break;
      }
      case "Delete":
      case "Backspace": {
        // Only fire Delete when the row itself is focused (not an input inside it).
        const target = e.target as HTMLElement;
        const isInput =
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable;
        if (isInput) return;
        e.preventDefault();
        e.stopPropagation();
        onDeleteRef.current?.(currentRows[index], index);
        break;
      }
      case "PageDown": {
        e.preventDefault();
        onNextPageRef.current?.();
        break;
      }
      case "PageUp": {
        e.preventDefault();
        onPrevPageRef.current?.();
        break;
      }
      default:
        break;
    }
  }, []);

  // Attach to the tbody container. Read the ref only inside the effect
  // (never during render). Re-run when row count changes so a late-mounting
  // tbody still gets the listener.
  useEffect(() => {
    const el = tbodyRef.current;
    if (!el) return;
    el.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      el.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [handleKeyDown, tbodyRef, rows.length]);

  // ---------------------------------------------------------------------------
  // Row props builder
  // ---------------------------------------------------------------------------

  const getRowProps = useCallback(
    (index: number): TableRowNavProps => {
      const base = getItemProps(index);
      const isActive = index === focusedIndex;
      return {
        ...base,
        "data-active": isActive ? "true" : "false",
      };
    },
    [getItemProps, focusedIndex],
  );

  return {
    activeIndex: focusedIndex,
    setActiveIndex: setFocusedIndex,
    getRowProps,
    tbodyRef,
  };
}
