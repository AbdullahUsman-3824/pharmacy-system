import type { KeyCombo } from "./types";

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/**
 * Canonical alias map: any of these tokens (lower-cased) resolve to the
 * exact `KeyboardEvent.key` string they correspond to.
 *
 * Sources:
 *  - https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
 */
const KEY_ALIASES: Readonly<Record<string, string>> = {
  // Whitespace / editing
  enter: "Enter",
  return: "Enter",
  space: " ",
  spacebar: " ",
  backspace: "Backspace",
  tab: "Tab",
  del: "Delete",
  delete: "Delete",
  ins: "Insert",
  insert: "Insert",
  // Navigation
  up: "ArrowUp",
  arrowup: "ArrowUp",
  down: "ArrowDown",
  arrowdown: "ArrowDown",
  left: "ArrowLeft",
  arrowleft: "ArrowLeft",
  right: "ArrowRight",
  arrowright: "ArrowRight",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pgup: "PageUp",
  pagedown: "PageDown",
  pgdn: "PageDown",
  pgdown: "PageDown",
  // Modifiers (in case someone writes them as the key itself)
  ctrl: "Control",
  control: "Control",
  alt: "Alt",
  shift: "Shift",
  meta: "Meta",
  cmd: "Meta",
  win: "Meta",
  // Function keys — kept lower-case for lookup
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "F5",
  f6: "F6",
  f7: "F7",
  f8: "F8",
  f9: "F9",
  f10: "F10",
  f11: "F11",
  f12: "F12",
  // Punctuation / symbols with common names
  escape: "Escape",
  esc: "Escape",
  minus: "-",
  plus: "+",
  equals: "=",
  slash: "/",
  backslash: "\\",
  period: ".",
  comma: ",",
  semicolon: ";",
  quote: "'",
  backtick: "`",
  openbracket: "[",
  closebracket: "]",
};

/** Modifier token names we recognise in a combo string. */
const MODIFIER_TOKENS = new Set(["ctrl", "control", "alt", "shift", "meta", "cmd", "win"]);

// ---------------------------------------------------------------------------
// parse
// ---------------------------------------------------------------------------

/**
 * Parse a human-written shortcut string into a {@link KeyCombo}.
 *
 * Accepts `+`-separated tokens in any order:
 *   - `"Ctrl+S"`  →  `{ key: "s", ctrl: true }`
 *   - `"Ctrl+Shift+S"` → `{ key: "s", ctrl: true, shift: true }`
 *   - `"Alt+1"` → `{ key: "1", alt: true }`
 *   - `"F1"` → `{ key: "F1" }`
 *   - `"Escape"` → `{ key: "Escape" }`
 *
 * Rules:
 *  - Tokens are trimmed and compared case-insensitively.
 *  - The non-modifier token is always the `key`.
 *  - Single printable characters are stored lower-case for consistent
 *    matching against `KeyboardEvent.key` (which is lower-case for
 *    unshifted letters).
 *  - Returns `null` on invalid / empty input.
 */
export function parseKeyCombo(raw: string): KeyCombo | null {
  if (!raw || typeof raw !== "string") return null;

  const tokens = raw.split("+").map((t) => t.trim()).filter(Boolean);
  if (tokens.length === 0) return null;

  let ctrl = false;
  let alt = false;
  let shift = false;
  let meta = false;
  const nonModifiers: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();

    if (lower === "ctrl" || lower === "control") {
      ctrl = true;
    } else if (lower === "alt") {
      alt = true;
    } else if (lower === "shift") {
      shift = true;
    } else if (lower === "meta" || lower === "cmd" || lower === "win") {
      meta = true;
    } else if (MODIFIER_TOKENS.has(lower)) {
      // Catch-all for any future modifier token we add to MODIFIER_TOKENS
      // but haven't explicitly handled above.
    } else {
      nonModifiers.push(token);
    }
  }

  // Exactly one non-modifier key is expected.
  if (nonModifiers.length === 0 || nonModifiers.length > 1) return null;

  const rawKey = nonModifiers[0];
  const lower = rawKey.toLowerCase();

  // Resolve alias or fall back to the original token.
  let key = KEY_ALIASES[lower] ?? rawKey;

  // Single printable characters are stored lower-case to match
  // KeyboardEvent.key, which returns "a" not "A" for an unshifted key press.
  if (key.length === 1) {
    key = key.toLowerCase();
  }

  const combo: KeyCombo = { key };
  if (ctrl) combo.ctrl = true;
  if (alt) combo.alt = true;
  if (shift) combo.shift = true;
  if (meta) combo.meta = true;

  return combo;
}

// ---------------------------------------------------------------------------
// format
// ---------------------------------------------------------------------------

/** Platform detection — only used for display labels, never for logic. */
function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /mac/i.test(navigator.platform ?? "");
}

/**
 * Pretty-print symbol map for modifier keys.
 * Returns OS-aware symbols when `symbolic` is true.
 */
function modifierLabels(symbolic: boolean): {
  ctrl: string;
  alt: string;
  shift: string;
  meta: string;
} {
  if (symbolic) {
    return isMac()
      ? { ctrl: "⌃", alt: "⌥", shift: "⇧", meta: "⌘" }
      : { ctrl: "Ctrl", alt: "Alt", shift: "Shift", meta: "Win" };
  }
  return { ctrl: "Ctrl", alt: "Alt", shift: "Shift", meta: "Meta" };
}

/**
 * Convert a {@link KeyCombo} back to a readable string.
 *
 * @param combo    The key combination to format.
 * @param symbolic When `true`, uses platform-native symbols (⌘ ⌥ ⇧ ⌃ on macOS).
 *                 Defaults to `false` (uses "Ctrl", "Alt", "Shift").
 *
 * Examples:
 *   `{ key: "s", ctrl: true }` → `"Ctrl+S"` (or `"⌃S"` on Mac with symbolic)
 *   `{ key: "F1" }` → `"F1"`
 *   `{ key: "1", alt: true }` → `"Alt+1"`
 */
export function formatKeyCombo(combo: KeyCombo, symbolic = false): string {
  const labels = modifierLabels(symbolic);
  const sep = symbolic && isMac() ? "" : "+";

  const parts: string[] = [];

  if (combo.ctrl) parts.push(labels.ctrl);
  if (combo.alt) parts.push(labels.alt);
  if (combo.shift) parts.push(labels.shift);
  if (combo.meta) parts.push(labels.meta);

  // Display key: single letters are upper-cased for readability ("S" not "s"),
  // special keys (F1, Enter, Escape…) are shown as-is.
  const displayKey =
    combo.key.length === 1 ? combo.key.toUpperCase() : combo.key;

  parts.push(displayKey);

  return parts.join(sep);
}

// ---------------------------------------------------------------------------
// compare
// ---------------------------------------------------------------------------

/**
 * Return `true` when two {@link KeyCombo} objects represent the same
 * key press — i.e. same key (case-insensitive) and identical modifier flags.
 *
 * Missing modifier flags are treated as `false`.
 *
 * @example
 * keyComboEquals({ key: "s", ctrl: true }, { key: "S", ctrl: true }) // true
 * keyComboEquals({ key: "s", ctrl: true }, { key: "s" })             // false
 */
export function keyComboEquals(a: KeyCombo, b: KeyCombo): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    Boolean(a.ctrl) === Boolean(b.ctrl) &&
    Boolean(a.alt) === Boolean(b.alt) &&
    Boolean(a.shift) === Boolean(b.shift) &&
    Boolean(a.meta) === Boolean(b.meta)
  );
}

// ---------------------------------------------------------------------------
// match
// ---------------------------------------------------------------------------

/**
 * Return `true` when a native {@link KeyboardEvent} matches a {@link KeyCombo}.
 *
 * Handles two edge cases that trip up naïve implementations:
 *
 * 1. **Shifted characters** — When Shift is held, `event.key` may be the
 *    *shifted* glyph (e.g. `"S"` instead of `"s"`).  We compare both
 *    `event.key` and `event.code`-derived key lower-cased to the combo key.
 *
 * 2. **AltGr (Windows)** — AltGr fires as `ctrl: true, alt: true`.  We
 *    deliberately do NOT special-case this here; callers that need to
 *    distinguish AltGr should check `event.getModifierState("AltGraph")`.
 *
 * @param event  The native keyboard event.
 * @param combo  The combo to test against.
 */
export function matchesKeyCombo(
  event: KeyboardEvent,
  combo: KeyCombo
): boolean {
  // --- Modifier check -------------------------------------------------------
  if (Boolean(combo.ctrl) !== event.ctrlKey) return false;
  if (Boolean(combo.alt) !== event.altKey) return false;
  if (Boolean(combo.shift) !== event.shiftKey) return false;
  if (Boolean(combo.meta) !== event.metaKey) return false;

  // --- Key check ------------------------------------------------------------
  const comboKeyLower = combo.key.toLowerCase();
  const eventKeyLower = event.key.toLowerCase();

  if (comboKeyLower === eventKeyLower) return true;

  // Fallback: derive the base key from event.code for letter/digit keys.
  // event.code is like "KeyS", "Digit1", "F1", etc.
  const baseFromCode = codeToBaseKey(event.code);
  if (baseFromCode !== null && baseFromCode.toLowerCase() === comboKeyLower) {
    return true;
  }

  return false;
}

/**
 * Derive the unmodified base key name from a `KeyboardEvent.code` string.
 *
 * Returns `null` for codes where a simple derivation isn't meaningful
 * (e.g. modifier keys themselves).
 *
 * @internal
 */
function codeToBaseKey(code: string): string | null {
  // "KeyS" → "s"
  if (/^Key[A-Z]$/.test(code)) {
    return code.slice(3).toLowerCase();
  }
  // "Digit1" → "1"
  if (/^Digit\d$/.test(code)) {
    return code.slice(5);
  }
  // "F1".."F12" — already in KeyboardEvent.key format
  if (/^F\d{1,2}$/.test(code)) {
    return code;
  }
  // "Numpad0".."Numpad9"
  if (/^Numpad\d$/.test(code)) {
    return code.slice(6);
  }
  // For everything else (ArrowUp, Enter, Escape, etc.) the event.key
  // comparison above will have already handled it.
  return null;
}

// ---------------------------------------------------------------------------
// Utility re-exports (convenience)
// ---------------------------------------------------------------------------

/**
 * Parse a combo string and immediately format it back for display.
 * Useful for normalising user-provided shortcut strings in settings UI.
 *
 * Returns the original string unchanged if parsing fails.
 */
export function normaliseComboString(raw: string, symbolic = false): string {
  const parsed = parseKeyCombo(raw);
  return parsed ? formatKeyCombo(parsed, symbolic) : raw;
}

/**
 * Check whether a {@link KeyboardEvent} matches **any** combo in an array.
 * Returns the first matching combo, or `null`.
 */
export function findMatchingCombo(
  event: KeyboardEvent,
  combos: KeyCombo[]
): KeyCombo | null {
  return combos.find((c) => matchesKeyCombo(event, c)) ?? null;
}
