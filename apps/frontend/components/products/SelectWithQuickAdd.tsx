"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { LookupEntity } from "@/lib/types";
import { QuickAddPopover } from "./lookup/QuickAddPopover";

interface SelectWithQuickAddProps {
  label: string;
  placeholder: string;
  options: LookupEntity[];
  value: string | null;
  onChange: (id: string) => void;
  onQuickAdd: (code: string, name: string) => string; // returns new id
}

export function SelectWithQuickAdd({
  label,
  placeholder,
  options,
  value,
  onChange,
  onQuickAdd,
}: SelectWithQuickAddProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  function handleQuickAdd(code: string, name: string) {
    const newId = onQuickAdd(code, name);
    onChange(newId);
    setPopoverOpen(false);
  }

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm text-ink-500">{label}</label>
      <div className="flex gap-2">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm text-ink-900 focus:outline-none"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setPopoverOpen((o) => !o)}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand hover:bg-brand/10"
        >
          <Plus size={18} />
        </button>
      </div>

      {popoverOpen && (
        <QuickAddPopover
          label={label}
          onCancel={() => setPopoverOpen(false)}
          onSave={handleQuickAdd}
        />
      )}
    </div>
  );
}