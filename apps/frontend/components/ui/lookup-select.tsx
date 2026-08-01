"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import Button from "./button";
import Card from "./card";
import Input from "./input";
import { cn } from "@/lib/cn";

export interface LookupSelectOption {
  value: string;
  label: string;
}

interface LookupSelectProps {
  label: string;
  placeholder: string;
  options: LookupSelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  onQuickAdd?: (name: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function LookupSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  onQuickAdd,
  disabled = false,
  error,
  className = "",
}: LookupSelectProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState("");
  const selectId = useId();
  const canQuickAdd = typeof onQuickAdd === "function";

  function handleSave() {
    const nextValue = quickAddValue.trim();
    if (!nextValue || !onQuickAdd) return;

    onQuickAdd(nextValue);
    setQuickAddValue("");
    setQuickAddOpen(false);
  }

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-[var(--color-text-secondary)]"
      >
        {label}
      </label>

      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <select
            id={selectId}
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className={cn(
              "h-11 w-full appearance-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-input)] px-4 pr-11 text-sm text-[var(--color-text)] transition-all duration-200 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-50",
              error &&
                "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger-soft)]",
              className,
            )}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-muted)]">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {canQuickAdd && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setQuickAddOpen((current) => !current)}
            disabled={disabled}
            className="h-11 w-11 shrink-0 px-0"
            aria-label={`Quick add ${label}`}
          >
            <Plus size={16} />
          </Button>
        )}

        {canQuickAdd && quickAddOpen && !disabled && (
          <Card
            padding="md"
            className="absolute left-0 top-full z-20 mt-2 w-full max-w-sm space-y-4 border border-[var(--color-border-light)] shadow-[var(--shadow-md)]"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Quick add {label.toLowerCase()}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Create a new option and select it immediately.
              </p>
            </div>

            <Input
              autoFocus
              value={quickAddValue}
              onChange={(event) => setQuickAddValue(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSave()}
              placeholder="Name"
            />

            <div className="flex items-center gap-2">
              <Button type="button" variant="primary" onClick={handleSave}>
                Save & select
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuickAddOpen(false);
                  setQuickAddValue("");
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}
      </div>

      {error ? (
        <p className="text-xs text-[var(--color-danger)]">{error}</p>
      ) : null}
    </div>
  );
}
