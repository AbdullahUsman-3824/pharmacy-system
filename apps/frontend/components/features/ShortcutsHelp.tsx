"use client";

import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Keyboard } from "lucide-react";

import { useShortcut } from "@/hooks/useShortcut";
import { ACTION_META } from "@/lib/keyboard/actions";
import { defaultBindings } from "@/lib/keyboard/defaults";
import { formatKeyCombo } from "@/lib/keyboard/parser";
import { useKeyboard } from "@/components/providers/KeyboardProvider";
import type { ShortcutBinding, ShortcutContext } from "@/lib/keyboard/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DisplayGroup =
  | "Global"
  | "Navigation"
  | "Sale"
  | "Form"
  | "Table"
  | "Interface";

interface DisplayRow {
  label: string;
  description: string;
  shortcuts: string[];
  group: DisplayGroup;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GROUP_ORDER: DisplayGroup[] = [
  "Sale",
  "Global",
  "Navigation",
  "Table",
  "Form",
  "Interface",
];

const GROUP_LABELS: Record<DisplayGroup, string> = {
  Sale: "Sale / POS",
  Global: "Global",
  Navigation: "Navigation",
  Table: "Table",
  Form: "Form",
  Interface: "Interface",
};

/** Map a binding's context + action-category to a display group. */
function toDisplayGroup(binding: ShortcutBinding): DisplayGroup {
  const ctx = (binding.context ?? "global") as ShortcutContext;
  if (ctx === "table") return "Table";
  if (ctx === "form") return "Form";
  if (ctx === "modal") return "Form";

  const meta = ACTION_META[binding.action];
  if (!meta) return "Global";

  switch (meta.category) {
    case "Sale":
      return "Sale";
    case "Navigation":
      return "Navigation";
    case "Interface":
      return "Interface";
    case "Printing":
      return "Global";
    default:
      return "Global";
  }
}

function buildRows(): DisplayRow[] {
  // Merge bindings by action — collect all combos per action.
  const map = new Map<string, { binding: ShortcutBinding; combos: string[] }>();

  for (const binding of defaultBindings) {
    const key = `${binding.action}:${binding.context ?? "global"}`;
    if (map.has(key)) {
      map.get(key)!.combos.push(...binding.keys.map((k) => formatKeyCombo(k)));
    } else {
      map.set(key, {
        binding,
        combos: binding.keys.map((k) => formatKeyCombo(k)),
      });
    }
  }

  return Array.from(map.values()).map(({ binding, combos }) => {
    const meta = ACTION_META[binding.action];
    return {
      label: meta?.label ?? binding.action,
      description: meta?.description ?? "",
      shortcuts: [...new Set(combos)], // deduplicate
      group: toDisplayGroup(binding),
    };
  });
}

// ---------------------------------------------------------------------------
// KbdTag
// ---------------------------------------------------------------------------

function KbdTag({ label }: { label: string }) {
  // Split "Ctrl+S" into ["Ctrl", "S"] for styled rendering.
  const parts = label.split("+");
  return (
    <span className="inline-flex items-center gap-0.5">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-0.5">
          {i > 0 && (
            <span className="text-[10px] text-[var(--color-text-muted)]">
              +
            </span>
          )}
          <kbd className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-muted)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--color-text-secondary)] shadow-[inset_0_-1px_0_var(--color-border-dark)]">
            {part}
          </kbd>
        </span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ShortcutsHelp
// ---------------------------------------------------------------------------

/**
 * F1 help overlay showing all registered shortcuts grouped by context.
 *
 * - Opens on F1 (registered as a global shortcut in `defaults.ts`).
 * - Shows tab-navigation between groups.
 * - Closes on Escape or the ✕ button.
 *
 * Mount once at the app root (inside `<KeyboardProvider>`).
 */
export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<DisplayGroup>("Sale");
  const { manager } = useKeyboard();

  const openHelp = useCallback(() => {
    setOpen(true);
    setActiveGroup("Sale");
  }, []);

  const closeHelp = useCallback(() => {
    setOpen(false);
  }, []);

  // F1 → open.
  useShortcut("help", openHelp);

  // Esc → close (while overlay is open, handled via DOM listener so the
  // global manager doesn't need to be alive).
  useCallback(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeHelp();
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () =>
      window.removeEventListener("keydown", handler, { capture: true });
  }, [open, closeHelp]);

  // All rows, built once.
  const allRows = useMemo(() => buildRows(), []);

  // Active-context rows.
  const activeContexts = manager.activeContexts;
  const currentContextGroups = useMemo<Set<DisplayGroup>>(() => {
    const set = new Set<DisplayGroup>(["Global", "Interface"]);
    if (activeContexts.includes("table")) set.add("Table");
    if (activeContexts.includes("form")) set.add("Form");
    if (activeContexts.includes("modal")) set.add("Form");
    return set;
  }, [activeContexts]);

  // Groups that actually have entries.
  const availableGroups = useMemo<DisplayGroup[]>(() => {
    const withRows = new Set(allRows.map((r) => r.group));
    return GROUP_ORDER.filter((g) => withRows.has(g));
  }, [allRows]);

  const visibleRows = useMemo(
    () => allRows.filter((r) => r.group === activeGroup),
    [allRows, activeGroup],
  );

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-help-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={closeHelp}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-lg)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Keyboard
              size={18}
              className="text-[var(--color-primary)]"
              aria-hidden="true"
            />
            <h2
              id="shortcuts-help-title"
              className="text-base font-semibold text-[var(--color-text)]"
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={closeHelp}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-placeholder)] transition-colors duration-150 hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Sidebar — group tabs */}
          <nav
            aria-label="Shortcut groups"
            className="flex w-40 shrink-0 flex-col gap-0.5 border-r border-[var(--color-border-light)] p-3"
          >
            {availableGroups.map((group) => {
              const isActive = group === activeGroup;
              const isCurrent = currentContextGroups.has(group);
              return (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  aria-current={isActive ? "true" : undefined}
                  className={[
                    "flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium transition-colors duration-100",
                    isActive
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]",
                  ].join(" ")}
                >
                  <span>{GROUP_LABELS[group]}</span>
                  {/* Dot indicator: group is part of current context */}
                  {isCurrent && !isActive && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]"
                      title="Active in current context"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}

            <div className="mt-auto pt-4">
              <p className="px-3 text-[10px] leading-relaxed text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-primary)]">
                  ●
                </span>{" "}
                Active in current view
              </p>
            </div>
          </nav>

          {/* Content — shortcut rows */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="px-6 py-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                {GROUP_LABELS[activeGroup]}
              </h3>

              {visibleRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                  No shortcuts in this group.
                </p>
              ) : (
                <table className="w-full text-sm" role="table">
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Action</th>
                      <th scope="col">Shortcut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row, i) => (
                      <tr
                        key={i}
                        className="group border-b border-[var(--color-border-light)] last:border-b-0"
                      >
                        <td className="py-2.5 pr-4">
                          <p className="font-medium text-[var(--color-text)]">
                            {row.label}
                          </p>
                          {row.description && (
                            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                              {row.description}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            {row.shortcuts.map((s, si) => (
                              <span
                                key={si}
                                className="flex items-center gap-1"
                              >
                                {si > 0 && (
                                  <span className="text-xs text-[var(--color-text-muted)]">
                                    or
                                  </span>
                                )}
                                <KbdTag label={s} />
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-border-light)] px-6 py-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Customize shortcuts in{" "}
            <span className="font-medium text-[var(--color-text-secondary)]">
              Settings → Keyboard
            </span>
          </p>
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-background-muted)] px-1.5 py-0.5 font-mono text-[11px]">
              Esc
            </kbd>
            to close
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
