import { Search } from "lucide-react";

interface LookupSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  entityLabelPlural: string;
  count: number;
}

export function LookupSearchBar({ value, onChange, entityLabelPlural, count }: LookupSearchBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-card px-4 py-3 shadow-panel">
      <Search size={18} className="text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Search ${entityLabelPlural}...`}
        className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
      />
      <span className="shrink-0 text-sm text-ink-500">
        {count} {entityLabelPlural}
      </span>
    </div>
  );
}