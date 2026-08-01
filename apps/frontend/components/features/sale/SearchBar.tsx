import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-card px-4 py-3 shadow-panel">
      <Search size={18} className="text-ink-400" />
      <input
        type="text"
        placeholder="Scan barcode or search medicine name"
        className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
      />
    </div>
  );
}
