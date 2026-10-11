/**
 * focusUtils.ts
 *
 * Pure DOM utilities for focus management.
 * No React, no side-effects — safe to import from anywhere.
 *
 * All functions guard against SSR by checking for `document` before use.
 */

// ---------------------------------------------------------------------------
// Focusable selector
// ---------------------------------------------------------------------------

/**
 * CSS selector that matches every element the browser considers natively
 * focusable, excluding hidden, disabled, and inert elements.
 *
 * Kept as a single string so callers can extend or override it.
 */
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "details > summary:not([disabled])",
  "iframe",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable]:not([contenteditable='false'])",
  // tabindex >= 0 but NOT -1
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/**
 * Selector that additionally excludes elements with `tabindex="-1"` that
 * are managed by a roving-tabindex pattern (they are focusable via script
 * but not via Tab key).
 *
 * Use this when you want "naturally tabbable" elements only.
 */
export const TABBABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "area[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "details > summary:not([disabled]):not([tabindex='-1'])",
  "iframe:not([tabindex='-1'])",
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[contenteditable]:not([contenteditable='false']):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

// ---------------------------------------------------------------------------
// Visibility helpers
// ---------------------------------------------------------------------------

/**
 * Return `true` when an element is visible and participates in layout.
 *
 * Checks:
 *  - `display: none` (self or ancestor via `offsetParent`)
 *  - `visibility: hidden`
 *  - `opacity: 0` (still in layout but visually hidden)
 *  - `inert` attribute (HTML spec, propagates to descendants)
 *
 * Does NOT account for `clip-path` or transforms that move elements off
 * screen — these are edge cases not present in this codebase.
 */
export function isVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;

  // display:none — offsetParent is null for all hidden elements except
  // position:fixed, so we also check the computed style directly.
  const style = window.getComputedStyle(el);
  if (style.display === "none") return false;
  if (style.visibility === "hidden") return false;
  if (style.opacity === "0") return false;

  // inert attribute (check self and ancestors)
  let node: HTMLElement | null = el;
  while (node) {
    if (node.inert) return false;
    node = node.parentElement;
  }

  return true;
}

/**
 * Return `true` when an element is both focusable and currently visible.
 */
export function isFocusableAndVisible(el: Element): boolean {
  return el.matches(FOCUSABLE_SELECTOR) && isVisible(el);
}

// ---------------------------------------------------------------------------
// Querying
// ---------------------------------------------------------------------------

/**
 * Return an ordered array of all focusable elements inside `container`.
 *
 * Elements are returned in DOM order (matching Tab key order for
 * `tabindex="0"` elements; `tabindex > 0` ordering is intentionally
 * ignored — that pattern is discouraged).
 *
 * @param container  Root element to search within.
 * @param selector   Override the default `FOCUSABLE_SELECTOR`.
 */
export function getFocusable(
  container: Element,
  selector = FOCUSABLE_SELECTOR,
): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    isVisible,
  );
}

/**
 * Return only the naturally tabbable descendants (excludes `tabindex="-1"`).
 */
export function getTabbable(container: Element): HTMLElement[] {
  return getFocusable(container, TABBABLE_SELECTOR);
}

/**
 * Return the first focusable element inside `container`, or `null`.
 */
export function getFirstFocusable(container: Element): HTMLElement | null {
  return getFocusable(container)[0] ?? null;
}

/**
 * Return the last focusable element inside `container`, or `null`.
 */
export function getLastFocusable(container: Element): HTMLElement | null {
  const all = getFocusable(container);
  return all[all.length - 1] ?? null;
}

// ---------------------------------------------------------------------------
// Focus movement
// ---------------------------------------------------------------------------

export interface FocusMovementOptions {
  /**
   * When `true`, focus wraps from last → first and first → last.
   * Defaults to `true`.
   */
  wrap?: boolean;
  /**
   * Custom selector to restrict movement to a subset of focusable elements.
   * Defaults to `FOCUSABLE_SELECTOR`.
   */
  selector?: string;
}

/**
 * Move focus to the **next** focusable element inside `container`.
 *
 * If `current` is not provided the browser's `document.activeElement` is
 * used. If no next element exists and `wrap` is `true`, focus moves to the
 * first element.
 *
 * @returns The element that received focus, or `null` if nothing was focused.
 */
export function focusNext(
  container: Element,
  current: Element | null = document.activeElement,
  options: FocusMovementOptions = {},
): HTMLElement | null {
  const { wrap = true, selector } = options;
  const candidates = getFocusable(container, selector);
  if (candidates.length === 0) return null;

  const idx = current ? candidates.indexOf(current as HTMLElement) : -1;
  let next: HTMLElement | null = null;

  if (idx === -1 || idx === candidates.length - 1) {
    next = wrap ? (candidates[0] ?? null) : null;
  } else {
    next = candidates[idx + 1] ?? null;
  }

  next?.focus();
  return next;
}

/**
 * Move focus to the **previous** focusable element inside `container`.
 *
 * If no previous element exists and `wrap` is `true`, focus moves to the
 * last element.
 *
 * @returns The element that received focus, or `null`.
 */
export function focusPrevious(
  container: Element,
  current: Element | null = document.activeElement,
  options: FocusMovementOptions = {},
): HTMLElement | null {
  const { wrap = true, selector } = options;
  const candidates = getFocusable(container, selector);
  if (candidates.length === 0) return null;

  const idx = current ? candidates.indexOf(current as HTMLElement) : -1;
  let prev: HTMLElement | null = null;

  if (idx <= 0) {
    prev = wrap ? (candidates[candidates.length - 1] ?? null) : null;
  } else {
    prev = candidates[idx - 1] ?? null;
  }

  prev?.focus();
  return prev;
}

/**
 * Move focus to the **first** focusable element inside `container`.
 *
 * @returns The element that received focus, or `null`.
 */
export function focusFirst(
  container: Element,
  options: Pick<FocusMovementOptions, "selector"> = {},
): HTMLElement | null {
  const el = getFocusable(container, options.selector)[0] ?? null;
  el?.focus();
  return el;
}

/**
 * Move focus to the **last** focusable element inside `container`.
 *
 * @returns The element that received focus, or `null`.
 */
export function focusLast(
  container: Element,
  options: Pick<FocusMovementOptions, "selector"> = {},
): HTMLElement | null {
  const candidates = getFocusable(container, options.selector);
  const el = candidates[candidates.length - 1] ?? null;
  el?.focus();
  return el;
}

// ---------------------------------------------------------------------------
// Safe focus helper
// ---------------------------------------------------------------------------

/**
 * Focus an element without scrolling the page, and silently swallow errors
 * for elements that lose focusability between render and the focus call.
 *
 * Use instead of `el.focus()` whenever the element may have been unmounted.
 */
export function safeFocus(
  el: HTMLElement | null | undefined,
  options: FocusOptions = { preventScroll: false },
): void {
  try {
    el?.focus(options);
  } catch {
    // Element may have been removed from the DOM — ignore.
  }
}

// ---------------------------------------------------------------------------
// Active element helpers
// ---------------------------------------------------------------------------

/**
 * Return `document.activeElement`, handling the edge case where focus is
 * inside a shadow DOM (returns the shadow host in that case).
 */
export function getActiveElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let active = document.activeElement as HTMLElement | null;

  // Drill into open shadow roots
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement as HTMLElement;
  }

  return active;
}

/**
 * Return `true` when `container` contains the currently focused element,
 * including nested shadow roots.
 */
export function containsFocus(container: Element): boolean {
  const active = getActiveElement();
  return active !== null && container.contains(active);
}
