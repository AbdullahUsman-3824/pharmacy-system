"use client";

import { useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import type { LookupEntity } from "@repo/shared/types/lookups";

interface LookupRowProps {
  index: number;
  item: LookupEntity;
  onSave: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function LookupRow({ index, item, onSave, onDelete }: LookupRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);

  function save() {
    if (!name.trim()) return;
    onSave(item.id, name.trim());
    setEditing(false);
  }

  function cancel() {
    setName(item.name);
    setEditing(false);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Delete "${item.name}"?`)) {
      onDelete(item.id);
    }
  }

  if (editing) {
    return (
      <div className="grid grid-cols-[48px_1fr_100px] items-center gap-3 rounded-lg border border-brand px-4 py-2">
        <span className="text-ink-400 text-sm">{index}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          autoFocus
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
      className="group grid cursor-pointer grid-cols-[48px_1fr_100px] items-center gap-3 border-b border-border-soft px-4 py-3 text-sm hover:bg-surface-sunken"
    >
      <span className="text-ink-400">{index}</span>
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
