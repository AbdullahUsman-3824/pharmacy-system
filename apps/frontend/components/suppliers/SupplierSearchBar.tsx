// apps/frontend/components/suppliers/SupplierSearchBar.tsx
"use client";

import { Plus, Search } from "lucide-react";

interface SupplierSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  count: number;
  onAddClick: () => void;
}

export function SupplierSearchBar({
  value,
  onChange,
  count,
  onAddClick,
}: SupplierSearchBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-card px-4 py-3 shadow-panel">
      <Search size={18} className="text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search suppliers..."
        className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
      />
      <span className="shrink-0 text-sm text-ink-500">{count} suppliers</span>
      <button
        onClick={onAddClick}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <Plus size={16} />
        Add Supplier
      </button>
    </div>
  );
}
