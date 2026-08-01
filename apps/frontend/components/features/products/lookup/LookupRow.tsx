"use client";

import { useState } from "react";
import { Check, X, Trash2, Pencil } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
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
      <TableRow className="border-b border-[var(--color-border-light)] bg-[var(--color-primary-soft)] last:border-b-0">
        <TableCell className="px-5 py-3 text-sm text-[var(--color-text-muted)]">
          {index}
        </TableCell>
        <TableCell className="px-5 py-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            autoFocus
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-all duration-200"
          />
        </TableCell>
        <TableCell className="px-5 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={save}
              className="text-[var(--color-success)] hover:text-[var(--color-success-text)] transition-colors duration-200"
              title="Save"
            >
              <Check size={18} />
            </button>
            <button
              onClick={cancel}
              className="text-[var(--color-danger-text)] hover:text-[var(--color-danger)] transition-colors duration-200"
              title="Cancel"
            >
              <X size={18} />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="border-b border-[var(--color-border-light)] transition-colors last:border-b-0 hover:bg-[var(--color-row-hover)]">
      <TableCell className="px-5 py-3 text-sm text-[var(--color-text-muted)]">
        {index}
      </TableCell>
      <TableCell className="px-5 py-3 text-sm font-medium text-[var(--color-text)]">
        {item.name}
      </TableCell>
      <TableCell className="px-5 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="text-[var(--color-text-placeholder)] hover:text-[var(--color-primary)] transition-colors duration-200"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="text-[var(--color-text-placeholder)] hover:text-[var(--color-danger-text)] transition-colors duration-200"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}