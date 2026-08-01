import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  entityLabelPlural: string;
  count: number;
}

export function SearchBar({
  value,
  onChange,
  entityLabelPlural,
  count,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 shadow-[var(--shadow-sm)]">
      <Search size={18} className="text-[var(--color-text-placeholder)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Search ${entityLabelPlural}...`}
        className="w-full bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none"
      />
      <span className="shrink-0 text-sm text-[var(--color-text-muted)]">
        {count} {entityLabelPlural}
      </span>
    </div>
  );
}
