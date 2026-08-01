"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { LookupEntity } from "@repo/shared/types/lookups";
import { QuickAddPopover } from "./lookup/QuickAddPopover";

interface SelectWithQuickAddProps {
  label: string;
  placeholder: string;
  options: LookupEntity[];
  value: string | null;
  onChange: (id: string) => void;
  onQuickAdd?: (name: string) => void;
  disabled?: boolean;
}

export function SelectWithQuickAdd({
  label,
  placeholder,
  options,
  value,
  onChange,
  onQuickAdd,
  disabled = false,
}: SelectWithQuickAddProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const canQuickAdd = !!onQuickAdd;

  function handleQuickAdd(name: string) {
    if (!onQuickAdd) return;

    onQuickAdd(name);
    setPopoverOpen(false);
  }

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm text-ink-500">{label}</label>

      <div className="flex gap-2">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm text-ink-900 focus:outline-none disabled:bg-gray-100 disabled:text-ink-500"
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

        {canQuickAdd && (
          <button
            type="button"
            onClick={() => setPopoverOpen((o) => !o)}
            disabled={disabled}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {canQuickAdd && popoverOpen && (
        <QuickAddPopover
          label={label}
          onCancel={() => setPopoverOpen(false)}
          onSave={handleQuickAdd}
        />
      )}
    </div>
  );
}
