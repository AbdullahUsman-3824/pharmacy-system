"use client";

import { useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import type { LookupEntity } from "@/lib/types";

interface LookupRowProps {
  item: LookupEntity;
  onSave: (id: string, code: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function LookupRow({ item, onSave, onDelete }: LookupRowProps) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(item.code);
  const [name, setName] = useState(item.name);

  function save() {
    if (!code.trim() || !name.trim()) return;
    onSave(item.id, code.trim(), name.trim());
    setEditing(false);
  }

  function cancel() {
    setCode(item.code);
    setName(item.name);
    setEditing(false);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation(); // don't trigger row-click edit mode
    if (confirm(`Delete "${item.name}"?`)) {
      onDelete(item.id);
    }
  }

  if (editing) {
    return (
      <div className="grid grid-cols-[140px_1fr_100px] items-center gap-3 rounded-lg border border-brand px-4 py-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-lg border border-border bg-surface-sunken px-3 py-1.5 text-sm focus:outline-none"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="rounded-lg border border-border bg-surface-sunken px-3 py-1.5 text-sm focus:outline-none"
        />
        <div className="flex gap-2">
          <button onClick={save} className="text-success">
            <Check size={18} />
          </button>
          <button onClick={cancel} className="text-danger-strong">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="group grid cursor-pointer grid-cols-[140px_1fr_100px] items-center gap-3 border-b border-border-soft px-4 py-3 text-sm hover:bg-surface-sunken"
    >
      <span className="text-ink-500">{item.code}</span>
      <span className="font-medium text-ink-900">{item.name}</span>
      <button
        onClick={handleDelete}
        className="justify-self-end text-ink-400 opacity-0 hover:text-danger-strong group-hover:opacity-100"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
