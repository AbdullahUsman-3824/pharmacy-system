"use client";

import { useState } from "react";

interface QuickAddPopoverProps {
  label: string;
  onSave: (code: string, name: string) => void;
  onCancel: () => void;
}

export function QuickAddPopover({ label, onSave, onCancel }: QuickAddPopoverProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  function submit() {
    if (!code.trim() || !name.trim()) return;
    onSave(code.trim(), name.trim());
  }

  return (
    <div className="absolute left-0 top-full z-10 mt-2 w-72 rounded-xl border border-border bg-surface-card p-4 shadow-card">
      <p className="mb-3 text-sm text-ink-500">Quick add {label.toLowerCase()}</p>

      <input
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Code (e.g. GSK)"
        className="mb-2 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm focus:outline-none"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Name"
        className="mb-3 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm focus:outline-none"
      />

      <div className="flex gap-2">
        <button
          onClick={submit}
          className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Save & select
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-700 hover:bg-surface-sunken"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}