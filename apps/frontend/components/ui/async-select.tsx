"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Plus, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export interface AsyncSelectOption {
  id: string;
  name: string;
}

interface UseOptionsResult<T> {
  data?: T[];
  isLoading: boolean;
  isFetching: boolean;
}

interface AsyncSelectProps<T extends AsyncSelectOption> {
  label?: string;
  placeholder?: string;
  value: string | null;
  /** Label to show for the currently selected value (e.g. from initialData in edit mode) */
  selectedLabel?: string | null;
  onChange: (id: string | null, option?: T) => void;
  /** Pass one of the useXOptions(search) hooks here */
  useOptions: (search: string) => UseOptionsResult<T>;
  onQuickAdd?: (name: string, onCreated: (option: T) => void) => void;
  /** Custom row renderer — defaults to plain option.name */
  renderOption?: (option: T) => ReactNode;
  error?: string;
  disabled?: boolean;
  minChars?: number;
  debounceMs?: number;
  fullWidth?: boolean;
  className?: string;
  /** Extra classes applied to the trigger box (e.g. "h-9 px-3" for compact POS layout) */
  triggerClassName?: string;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

export function AsyncSelect<T extends AsyncSelectOption = AsyncSelectOption>({
  label,
  placeholder = "Search...",
  value,
  selectedLabel,
  onChange,
  useOptions,
  onQuickAdd,
  renderOption,
  error,
  disabled,
  minChars = 2,
  debounceMs = 350,
  fullWidth = true,
  className = "",
  triggerClassName = "",
}: AsyncSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [displayLabel, setDisplayLabel] = useState(selectedLabel ?? "");
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, debounceMs);
  const trimmed = debouncedQuery.trim();
  const search = trimmed.length >= minChars ? trimmed : "";

  const { data: options = [], isLoading, isFetching } = useOptions(search);

  // Keep display label in sync when selectedLabel prop changes (edit mode)
  useEffect(() => {
    setDisplayLabel(selectedLabel ?? "");
  }, [selectedLabel]);

  // Position the portal dropdown to sit below the trigger
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function reposition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }

    reposition();

    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const trigger = triggerRef.current;
      // The dropdown is portalled to body — check by data attribute
      const dropdown = document.getElementById("async-select-dropdown");
      if (
        trigger &&
        !trigger.contains(target) &&
        dropdown &&
        !dropdown.contains(target)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSelect(option: T) {
    onChange(option.id, option);
    setDisplayLabel(option.name);
    setQuery("");
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setDisplayLabel("");
    setQuery("");
  }

  const showCreate =
    !!onQuickAdd &&
    search.length >= minChars &&
    !isFetching &&
    !options.some((o) => o.name.toLowerCase() === search.toLowerCase());

  const widthClass = fullWidth ? "w-full" : "";

  const dropdown =
    open && !disabled && dropdownPos
      ? createPortal(
          <div
            id="async-select-dropdown"
            style={{
              position: "absolute",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
            className="max-h-64 overflow-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg"
          >
            {query.trim().length > 0 && query.trim().length < minChars && (
              <div className="px-3 py-2 text-sm text-[var(--color-text-muted)]">
                Type at least {minChars} characters...
              </div>
            )}

            {search.length >= minChars && isLoading && (
              <div className="px-3 py-2 text-sm text-[var(--color-text-muted)]">
                Searching...
              </div>
            )}

            {search.length >= minChars &&
              !isLoading &&
              options.length === 0 &&
              !showCreate && (
                <div className="px-3 py-2 text-sm text-[var(--color-text-muted)]">
                  No results found
                </div>
              )}

            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                onClick={() => handleSelect(option)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-background-muted)] transition-colors duration-150"
              >
                {renderOption ? renderOption(option) : option.name}
              </button>
            ))}

            {showCreate && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  onQuickAdd?.(search, (option) => {
                    handleSelect(option);
                  })
                }
                className="flex w-full items-center gap-2 border-t border-[var(--color-border)] px-3 py-2 text-left text-sm text-[var(--color-primary)] hover:bg-[var(--color-background-muted)] transition-colors duration-150"
              >
                <Plus size={14} />
                Add "{search}"
              </button>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
          {label}
        </label>
      )}

      <div ref={triggerRef} className="relative">
        <div
          className={`flex items-center gap-2 bg-[var(--color-input)] border rounded-[var(--radius-sm)] px-4 py-2 text-[var(--color-text)] transition-all duration-200 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-soft)] ${
            error
              ? "border-[var(--color-danger)] focus-within:border-[var(--color-danger)] focus-within:ring-[var(--color-danger-soft)]"
              : "border-[var(--color-border)]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${triggerClassName}`}
        >
          <input
            value={open ? query : displayLabel}
            data-nav="true"
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              if (disabled) return;
              setOpen(true);
              setQuery("");
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none disabled:cursor-not-allowed"
            style={{ lineHeight: "1.5rem" }}
          />

          {isFetching && (
            <Loader2
              size={16}
              className="animate-spin text-[var(--color-text-placeholder)] flex-shrink-0"
            />
          )}

          {!disabled && value && !isFetching && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[var(--color-text-placeholder)] hover:text-[var(--color-text)] flex-shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-[var(--color-danger)]">{error}</p>
        )}
      </div>

      {dropdown}
    </div>
  );
}
