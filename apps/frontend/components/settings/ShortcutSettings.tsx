"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Keyboard, AlertTriangle, Check, X } from "lucide-react";

import { useKeyboard } from "@/components/providers/KeyboardProvider";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Separator from "@/components/ui/separator";
import Tabs from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { ACTION_META, ACTION_META_LIST } from "@/lib/keyboard/actions";
import { defaultBindings } from "@/lib/keyboard/defaults";
import { formatKeyCombo } from "@/lib/keyboard/parser";
import type { StoredOverride } from "@/lib/keyboard/storage";
import type {
  ActionCategory,
  KeyCombo,
  ShortcutAction,
  ShortcutContext,
} from "@/lib/keyboard/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: ActionCategory[] = [
  "General",
  "Navigation",
  "Sale",
  "Printing",
  "Interface",
];

/** Keys that are not useful as standalone shortcut keys. */
const IGNORED_KEYS = new Set([
  "Control",
  "Shift",
  "Alt",
  "Meta",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  "Fn",
  "Dead",
  "Unidentified",
]);

// ---------------------------------------------------------------------------
// useCapture hook — handles the keydown capture for remapping
// ---------------------------------------------------------------------------

interface UseCaptureResult {
  isCapturing: boolean;
  captured: KeyCombo | null;
  startCapture: () => void;
  cancelCapture: () => void;
  confirmCapture: () => void;
}

function useCapture(onConfirm: (combo: KeyCombo) => void): UseCaptureResult {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState<KeyCombo | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (IGNORED_KEYS.has(e.key)) return;

    // Escape cancels capture without assigning.
    if (e.key === "Escape") {
      setIsCapturing(false);
      setCaptured(null);
      return;
    }

    const combo: KeyCombo = {
      key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
    };
    if (e.ctrlKey) combo.ctrl = true;
    if (e.altKey) combo.alt = true;
    if (e.shiftKey) combo.shift = true;
    if (e.metaKey) combo.meta = true;

    setCaptured(combo);
  }, []);

  useEffect(() => {
    if (!isCapturing) return;
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isCapturing, handleKeyDown]);

  const startCapture = useCallback(() => {
    setCaptured(null);
    setIsCapturing(true);
  }, []);

  const cancelCapture = useCallback(() => {
    setIsCapturing(false);
    setCaptured(null);
  }, []);

  const confirmCapture = useCallback(() => {
    if (!captured) return;
    onConfirm(captured);
    setIsCapturing(false);
    setCaptured(null);
  }, [captured, onConfirm]);

  return { isCapturing, captured, startCapture, cancelCapture, confirmCapture };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render a KeyCombo as one or more <kbd> elements. */
function ComboDisplay({
  combos,
  className,
}: {
  combos: [KeyCombo, ...KeyCombo[]];
  className?: string;
}) {
  return (
    <span className={cn("flex flex-wrap items-center gap-1", className)}>
      {combos.map((combo, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">or</span>
          )}
          <kbd className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-muted)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--color-text-secondary)] shadow-[inset_0_-1px_0_var(--color-border-dark,#ccc)]">
            {formatKeyCombo(combo)}
          </kbd>
        </span>
      ))}
    </span>
  );
}

/** Build a reverse lookup: "action:context" → set of actions that share a combo. */
function buildConflictMap(
  allBindings: {
    action: ShortcutAction;
    context: ShortcutContext;
    keys: [KeyCombo, ...KeyCombo[]];
  }[],
): Map<string, ShortcutAction[]> {
  // combo-string → list of "action:context" that own it
  const comboToOwners = new Map<string, string[]>();

  for (const b of allBindings) {
    const slot = `${b.action}:${b.context}`;
    for (const k of b.keys) {
      const key = formatKeyCombo(k);
      if (!comboToOwners.has(key)) comboToOwners.set(key, []);
      comboToOwners.get(key)!.push(slot);
    }
  }

  // slot → conflicting actions
  const result = new Map<string, ShortcutAction[]>();
  for (const [, slots] of comboToOwners) {
    if (slots.length < 2) continue;
    for (const slot of slots) {
      const conflicts = slots
        .filter((s) => s !== slot)
        .map((s) => s.split(":")[0] as ShortcutAction);
      result.set(slot, [...(result.get(slot) ?? []), ...conflicts]);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

interface RowProps {
  action: ShortcutAction;
  context: ShortcutContext;
  currentKeys: [KeyCombo, ...KeyCombo[]];
  defaultKeys: [KeyCombo, ...KeyCombo[]] | undefined;
  isOverridden: boolean;
  conflictsWith: ShortcutAction[];
  onSave: (override: StoredOverride) => void;
  onReset: (action: ShortcutAction, context: ShortcutContext) => void;
}

function ShortcutRow({
  action,
  context,
  currentKeys,
  defaultKeys,
  isOverridden,
  conflictsWith,
  onSave,
  onReset,
}: RowProps) {
  const meta = ACTION_META[action];

  const handleConfirm = useCallback(
    (combo: KeyCombo) => {
      onSave({ action, context, keys: [combo] });
    },
    [action, context, onSave],
  );

  const { isCapturing, captured, startCapture, cancelCapture, confirmCapture } =
    useCapture(handleConfirm);

  const captureRef = useRef<HTMLButtonElement>(null);

  // Auto-focus capture button when capture starts so keyboard events land.
  useEffect(() => {
    if (isCapturing) captureRef.current?.focus();
  }, [isCapturing]);

  const hasConflict = conflictsWith.length > 0;

  return (
    <div
      className={cn(
        "group grid grid-cols-[1fr_auto] items-start gap-4 rounded-[var(--radius-sm)] px-3 py-3 transition-colors duration-150",
        "hover:bg-[var(--color-row-hover)]",
        hasConflict &&
          "bg-[var(--color-warning-soft)] hover:bg-[var(--color-warning-soft)]",
      )}
    >
      {/* Left — action info */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text)]">
            {meta.label}
          </span>

          {isOverridden && (
            <Badge variant="info" size="sm" rounded>
              custom
            </Badge>
          )}

          {hasConflict && (
            <span
              className="flex items-center gap-1 text-xs text-[var(--color-warning-text)]"
              title={`Conflicts with: ${conflictsWith.map((a) => ACTION_META[a].label).join(", ")}`}
            >
              <AlertTriangle size={12} />
              conflict
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
          {meta.description}
        </p>

        {/* Capture area */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isCapturing ? (
            <>
              {/* Live capture target */}
              <button
                ref={captureRef}
                className={cn(
                  "inline-flex min-w-[7rem] items-center justify-center rounded-[var(--radius-sm)] border-2 border-dashed px-3 py-1.5 text-sm font-mono transition-colors duration-150",
                  "border-[var(--color-primary)] bg-[var(--color-primary-soft,color-mix(in_srgb,var(--color-primary)_10%,transparent))]",
                  "text-[var(--color-primary)] outline-none",
                )}
                aria-label="Press a key combination"
                // Prevent the button's own keydown from re-triggering capture.
                onKeyDown={(e) => e.stopPropagation()}
              >
                {captured ? (
                  formatKeyCombo(captured)
                ) : (
                  <span className="animate-pulse opacity-70">Press a key…</span>
                )}
              </button>

              {/* Confirm */}
              <button
                disabled={!captured}
                onClick={confirmCapture}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150",
                  "bg-[var(--color-success-soft)] text-[var(--color-success-text)]",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  "hover:bg-[var(--color-success-border)]",
                )}
                aria-label="Confirm new shortcut"
              >
                <Check size={14} />
              </button>

              {/* Cancel */}
              <button
                onClick={cancelCapture}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150",
                  "bg-[var(--color-danger-soft)] text-[var(--color-danger-text)]",
                  "hover:bg-[var(--color-danger-border)]",
                )}
                aria-label="Cancel"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <ComboDisplay combos={currentKeys} />

              {/* Edit button — always visible, styled subtly */}
              <button
                onClick={startCapture}
                className={cn(
                  "rounded-[var(--radius-sm)] px-2 py-0.5 text-xs text-[var(--color-text-placeholder)]",
                  "transition-colors duration-150",
                  "opacity-0 group-hover:opacity-100",
                  "hover:bg-[var(--color-border)] hover:text-[var(--color-text-secondary)]",
                )}
                aria-label={`Remap ${meta.label}`}
              >
                remap
              </button>
            </>
          )}
        </div>

        {/* Conflict detail */}
        {hasConflict && (
          <p className="mt-1.5 text-xs text-[var(--color-warning-text)]">
            Same combo as:{" "}
            {conflictsWith.map((a) => ACTION_META[a].label).join(", ")}
          </p>
        )}
      </div>

      {/* Right — reset button (only when overridden) */}
      <div className="flex shrink-0 items-start pt-0.5">
        {isOverridden && defaultKeys && (
          <button
            onClick={() => onReset(action, context)}
            className={cn(
              "flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs",
              "text-[var(--color-text-muted)] transition-colors duration-150",
              "hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-secondary)]",
            )}
            title={`Reset to ${formatKeyCombo(defaultKeys[0])}`}
            aria-label={`Reset ${meta.label} to default`}
          >
            <RotateCcw size={11} />
            reset
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category panel
// ---------------------------------------------------------------------------

interface CategoryPanelProps {
  category: ActionCategory;
  conflictMap: Map<string, ShortcutAction[]>;
  effectiveBindings: Map<string, [KeyCombo, ...KeyCombo[]]>; // "action:context" → keys
  overrideSet: Set<string>; // "action:context" strings that have overrides
  onSave: (override: StoredOverride) => void;
  onReset: (action: ShortcutAction, context: ShortcutContext) => void;
}

function CategoryPanel({
  category,
  conflictMap,
  effectiveBindings,
  overrideSet,
  onSave,
  onReset,
}: CategoryPanelProps) {
  const actions = ACTION_META_LIST.filter((m) => m.category === category);

  // Collect unique action+context pairs that have bindings.
  const rows = useMemo(() => {
    const seen = new Set<string>();
    const result: { action: ShortcutAction; context: ShortcutContext }[] = [];

    for (const { action } of actions) {
      for (const binding of defaultBindings) {
        if (binding.action !== action) continue;
        const ctx = binding.context ?? "global";
        const slot = `${action}:${ctx}`;
        if (seen.has(slot)) continue;
        seen.add(slot);
        result.push({ action, context: ctx });
      }
    }

    return result;
  }, [actions]);

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
        No shortcuts in this category.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {rows.map(({ action, context }) => {
        const slot = `${action}:${context}`;
        const currentKeys = effectiveBindings.get(slot);
        if (!currentKeys) return null;

        const defaultBinding = defaultBindings.find(
          (b) => b.action === action && (b.context ?? "global") === context,
        );

        return (
          <ShortcutRow
            key={slot}
            action={action}
            context={context}
            currentKeys={currentKeys}
            defaultKeys={defaultBinding?.keys}
            isOverridden={overrideSet.has(slot)}
            conflictsWith={conflictMap.get(slot) ?? []}
            onSave={onSave}
            onReset={onReset}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * ShortcutSettings
 *
 * Renders a full settings panel where users can:
 *  - Browse all actions grouped by category.
 *  - Click "remap" and press a new key combination to capture it.
 *  - See a live conflict warning when two actions share a combo.
 *  - Reset individual overrides or all overrides at once.
 *
 * Must be rendered inside `<KeyboardProvider>`.
 *
 * @example — embed in a settings page
 * ```tsx
 * import ShortcutSettings from "@/components/settings/ShortcutSettings";
 * export default function SettingsPage() {
 *   return <ShortcutSettings />;
 * }
 * ```
 *
 * @example — open from a Dialog / Modal
 * ```tsx
 * <Modal open={open} onClose={onClose} title="Keyboard Shortcuts" size="lg">
 *   <ShortcutSettings />
 * </Modal>
 * ```
 */
export default function ShortcutSettings() {
  const { overrides, applyOverride, resetOverride, resetAllOverrides } =
    useKeyboard();

  const [resetConfirm, setResetConfirm] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived data ──────────────────────────────────────────────────────────

  /**
   * Effective binding map: "action:context" → current keys.
   * Starts from defaults, then overlays user overrides.
   */
  const effectiveBindings = useMemo(() => {
    const map = new Map<string, [KeyCombo, ...KeyCombo[]]>();

    for (const b of defaultBindings) {
      const ctx = b.context ?? "global";
      // Only store the first occurrence per action:context (handles Alt+1..9
      // duplicates in defaults.ts).
      const slot = `${b.action}:${ctx}`;
      if (!map.has(slot)) map.set(slot, b.keys);
    }

    for (const o of overrides) {
      map.set(`${o.action}:${o.context}`, o.keys);
    }

    return map;
  }, [overrides]);

  /** Set of "action:context" slots that have a user override. */
  const overrideSet = useMemo(
    () => new Set(overrides.map((o) => `${o.action}:${o.context}`)),
    [overrides],
  );

  /** Conflict map built from the current effective bindings. */
  const conflictMap = useMemo(() => {
    const rows = Array.from(effectiveBindings.entries()).map(([slot, keys]) => {
      const [action, context] = slot.split(":") as [
        ShortcutAction,
        ShortcutContext,
      ];
      return { action, context, keys };
    });
    return buildConflictMap(rows);
  }, [effectiveBindings]);

  const totalConflicts = useMemo(() => conflictMap.size, [conflictMap]);

  const totalOverrides = overrides.length;

  // ── Reset all handler ─────────────────────────────────────────────────────

  const handleResetAll = useCallback(() => {
    if (!resetConfirm) {
      // First click — arm the confirmation, auto-cancel after 3 s.
      setResetConfirm(true);
      resetTimerRef.current = setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    // Second click — confirmed.
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setResetConfirm(false);
    resetAllOverrides();
  }, [resetConfirm, resetAllOverrides]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // ── Tabs ─────────────────────────────────────────────────────────────────

  const tabs = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        id: cat,
        label: cat,
        content: (
          <CategoryPanel
            category={cat}
            conflictMap={conflictMap}
            effectiveBindings={effectiveBindings}
            overrideSet={overrideSet}
            onSave={applyOverride}
            onReset={resetOverride}
          />
        ),
      })),
    [conflictMap, effectiveBindings, overrideSet, applyOverride, resetOverride],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-background-muted)]">
            <Keyboard
              size={18}
              className="text-[var(--color-text-secondary)]"
            />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Click &quot;remap&quot; on any row then press your new
              combination. Press Escape to cancel.
            </p>
          </div>
        </div>

        {/* Status badges + reset */}
        <div className="flex flex-wrap items-center gap-2">
          {totalOverrides > 0 && (
            <Badge variant="info" size="sm">
              {totalOverrides} custom{" "}
              {totalOverrides === 1 ? "shortcut" : "shortcuts"}
            </Badge>
          )}

          {totalConflicts > 0 && (
            <Badge variant="warning" size="sm">
              <AlertTriangle size={11} className="mr-1" />
              {totalConflicts} {totalConflicts === 1 ? "conflict" : "conflicts"}
            </Badge>
          )}

          {totalOverrides > 0 && (
            <Button
              variant={resetConfirm ? "danger" : "outline"}
              size="sm"
              onClick={handleResetAll}
              className="flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              {resetConfirm ? "Confirm reset" : "Reset all to defaults"}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-info-text)]" />
          Custom override
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle
            size={11}
            className="text-[var(--color-warning-text)]"
          />
          Combo conflict
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-background-muted)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--color-text-secondary)]">
            Esc
          </kbd>
          Cancel capture
        </span>
      </div>

      {/* Tabbed category list */}
      <Card variant="bordered" padding="sm">
        <Tabs tabs={tabs} variant="default" />
      </Card>
    </div>
  );
}
