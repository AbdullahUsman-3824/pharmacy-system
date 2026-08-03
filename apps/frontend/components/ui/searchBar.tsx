"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  entityLabelPlural?: string;
  count?: number;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onKeyDown,
  onFocus,
  entityLabelPlural,
  count,
  placeholder = `Search ${entityLabelPlural || "items"}...`,
  autoFocus,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 shadow-[var(--shadow-sm)]">
      <Search size={18} className="text-[var(--color-text-placeholder)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus-visible:outline-none focus-visible:ring-0"
      />
      {count !== undefined && entityLabelPlural && (
        <span className="shrink-0 text-sm text-[var(--color-text-muted)]">
          {count !== undefined && `${count} ${entityLabelPlural}`}
        </span>
      )}
    </div>
  );
}
