"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard } from "lucide-react";
import { GLOBAL_SHORTCUTS } from "@/lib/shortcuts/shortcuts";

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-row-hover)]"
        aria-label="Keyboard Shortcuts"
      >
        <Keyboard className="h-5 w-5 text-[var(--color-text-secondary)]" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-md,0_4px_12px_rgba(0,0,0,0.1))]">
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Keyboard Shortcuts
            </h3>

            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
              Global navigation shortcuts
            </p>
          </div>

          <div className="py-1">
            {GLOBAL_SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.id}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--color-row-hover)]"
              >
                <span className="text-sm text-[var(--color-text)]">
                  {shortcut.description}
                </span>

                <kbd className="min-w-14 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
                  {shortcut.shortcut}
                </kbd>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--color-border)] px-4 py-2">
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Page-specific shortcuts are shown within their respective screens.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
