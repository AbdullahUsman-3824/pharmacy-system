"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Search, ChevronRight, Command } from "lucide-react";

import { useShortcut } from "@/hooks/useShortcut";
import { ACTION_META_LIST } from "@/lib/keyboard/actions";
import { defaultBindings } from "@/lib/keyboard/defaults";
import { formatKeyCombo } from "@/lib/keyboard/parser";
import type { ActionMeta, ActionCategory } from "@/lib/keyboard/types";
import { useKeyboard } from "@/components/providers/KeyboardProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaletteItem {
  meta: ActionMeta;
  /** Primary key combo label, e.g. "Ctrl+K" */
  shortcut: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_ORDER: ActionCategory[] = [
  "Sale",
  "General",
  "Navigation",
  "Printing",
  "Interface",
];

function buildItems(): PaletteItem[] {
  return ACTION_META_LIST.map((meta) => {
    const binding = defaultBindings.find((b) => b.action === meta.action);
    const shortcut = binding ? formatKeyCombo(binding.keys[0]) : null;
    return { meta, shortcut };
  });
}

function scoreMatch(item: PaletteItem, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const label = item.meta.label.toLowerCase();
  const desc = item.meta.description.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (desc.includes(q)) return 30;
  return 0;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KbdHint({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-muted)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--color-text-muted)] shadow-[inset_0_-1px_0_var(--color-border-dark)]">
      {label}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// CommandPalette
// ---------------------------------------------------------------------------

/**
 * Global command palette opened by Ctrl+K.
 *
 * - Fuzzy-searches all registered {@link ShortcutAction}s by label / description.
 * - Keyboard-navigable with ↑ ↓ arrows, Enter to execute, Escape to close.
 * - Dispatches the selected action through the KeyboardManager so every
 *   `useShortcut` subscriber fires normally.
 * - Rendered in a portal so z-index stacking is always correct.
 *
 * Mount once at the app root (inside `<KeyboardProvider>`).
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { manager } = useKeyboard();

  // All items, built once.
  const allItems = useMemo(() => buildItems(), []);

  // Filtered + sorted items.
  const filtered = useMemo<PaletteItem[]>(() => {
    if (!query.trim()) {
      // No query: return items in canonical category order.
      return [...allItems].sort(
        (a, b) =>
          CATEGORY_ORDER.indexOf(a.meta.category) -
          CATEGORY_ORDER.indexOf(b.meta.category),
      );
    }
    return allItems
      .map((item) => ({ item, score: scoreMatch(item, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [query, allItems]);

  // ── Open / close ──────────────────────────────────────────────────────────

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIdx(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Ctrl+K opens.
  useShortcut("commandPalette", openPalette);

  // Pause the global keyboard manager while the palette is open so other
  // shortcuts don't fire while typing in the search box.
  useEffect(() => {
    if (open) {
      manager.disable();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      manager.enable();
    }
    // Cleanup: always re-enable if the component unmounts while open.
    return () => {
      if (open) manager.enable();
    };
  }, [open, manager]);

  // ── Keyboard handling inside the palette ──────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIdx((i) => Math.max(i - 1, 0));
          break;
        case "Enter": {
          e.preventDefault();
          const item = filtered[activeIdx];
          if (!item) break;
          closePalette();
          // Re-enable manager first, then dispatch action so subscribers fire.
          manager.enable();
          // Dispatch through the provider's handler map by synthesising a
          // programmatic action dispatch via a fake KeyboardEvent.
          // We use the manager's own registry to find and call the binding.
          const binding = manager.registry
            .getBindings()
            .find((b) => b.action === item.meta.action);
          if (binding) {
            const synth = new KeyboardEvent("keydown", {
              key: binding.keys[0].key,
              ctrlKey: binding.keys[0].ctrl ?? false,
              altKey: binding.keys[0].alt ?? false,
              shiftKey: binding.keys[0].shift ?? false,
              metaKey: binding.keys[0].meta ?? false,
              bubbles: true,
              cancelable: true,
            });
            window.dispatchEvent(synth);
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          closePalette();
          break;
        default:
          break;
      }
    },
    [filtered, activeIdx, closePalette, manager],
  );

  // Scroll active item into view.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // ── Group items by category for display ───────────────────────────────────
  // Must be called unconditionally (Rules of Hooks) — before any early return.
  const grouped = useMemo(() => {
    if (query.trim()) return null; // flat list when searching
    const map = new Map<ActionCategory, PaletteItem[]>();
    for (const item of filtered) {
      const cat = item.meta.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return map;
  }, [filtered, query]);

  // Flatten grouped items to map category indices to list indices.
  const flatItems = useMemo(() => {
    if (!grouped) return filtered;
    const out: PaletteItem[] = [];
    for (const cat of CATEGORY_ORDER) {
      const items = grouped.get(cat) ?? [];
      out.push(...items);
    }
    return out;
  }, [grouped, filtered]);

  if (!open) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={closePalette}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-lg)]">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border-light)] px-4 py-3">
          <Search
            size={16}
            className="shrink-0 text-[var(--color-text-placeholder)]"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            placeholder="Search actions…"
            className="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none"
            aria-label="Search actions"
            aria-autocomplete="list"
            aria-controls="cmd-palette-list"
            aria-activedescendant={
              flatItems[activeIdx]
                ? `cmd-item-${flatItems[activeIdx].meta.action}`
                : undefined
            }
            autoComplete="off"
            spellCheck={false}
          />
          <KbdHint label="Esc" />
        </div>

        {/* Results */}
        <div className="max-h-[min(400px,60vh)] overflow-y-auto">
          {flatItems.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
              No actions match &ldquo;{query}&rdquo;
            </p>
          ) : grouped ? (
            // Grouped view (no query)
            <ul
              id="cmd-palette-list"
              ref={listRef}
              role="listbox"
              className="py-1"
            >
              {CATEGORY_ORDER.map((cat) => {
                const catItems = grouped.get(cat);
                if (!catItems?.length) return null;
                return (
                  <li key={cat} role="presentation">
                    <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                      {cat}
                    </div>
                    <ul role="group" aria-label={cat}>
                      {catItems.map((item) => {
                        const flatIdx = flatItems.indexOf(item);
                        return (
                          <PaletteRow
                            key={item.meta.action}
                            item={item}
                            isActive={flatIdx === activeIdx}
                            onHover={() => setActiveIdx(flatIdx)}
                            onSelect={() => {
                              setActiveIdx(flatIdx);
                              handleKeyDown({
                                key: "Enter",
                                preventDefault: () => {},
                              } as KeyboardEvent<HTMLDivElement>);
                            }}
                          />
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          ) : (
            // Flat list (query active)
            <ul
              id="cmd-palette-list"
              ref={listRef}
              role="listbox"
              className="py-1"
            >
              {flatItems.map((item, idx) => (
                <PaletteRow
                  key={item.meta.action}
                  item={item}
                  isActive={idx === activeIdx}
                  onHover={() => setActiveIdx(idx)}
                  onSelect={() => {
                    setActiveIdx(idx);
                    handleKeyDown({
                      key: "Enter",
                      preventDefault: () => {},
                    } as KeyboardEvent<HTMLDivElement>);
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-border-light)] px-4 py-2">
          <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <KbdHint label="↑" />
              <KbdHint label="↓" />
              navigate
            </span>
            <span className="flex items-center gap-1">
              <KbdHint label="↵" />
              run
            </span>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
            <Command size={11} aria-hidden="true" />
            Pharmacy POS
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Row sub-component
// ---------------------------------------------------------------------------

interface PaletteRowProps {
  item: PaletteItem;
  isActive: boolean;
  onHover: () => void;
  onSelect: () => void;
}

function PaletteRow({ item, isActive, onHover, onSelect }: PaletteRowProps) {
  return (
    <li
      id={`cmd-item-${item.meta.action}`}
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={[
        "flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors duration-75",
        isActive
          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          : "text-[var(--color-text)] hover:bg-[var(--color-background-muted)]",
      ].join(" ")}
    >
      {/* Action label + description */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-none">
          {item.meta.label}
        </p>
        <p
          className={[
            "mt-0.5 truncate text-xs",
            isActive
              ? "text-[var(--color-primary)]"
              : "text-[var(--color-text-muted)]",
          ].join(" ")}
        >
          {item.meta.description}
        </p>
      </div>

      {/* Shortcut badge */}
      {item.shortcut && <KbdHint label={item.shortcut} />}

      {isActive && (
        <ChevronRight
          size={14}
          className="shrink-0 text-[var(--color-primary)]"
          aria-hidden="true"
        />
      )}
    </li>
  );
}
