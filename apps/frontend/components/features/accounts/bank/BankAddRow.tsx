"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

interface BankAddRowProps {
  onAdd: (name: string) => void;
  isHighlighted?: boolean;
}

export function BankAddRow({ onAdd, isHighlighted = false }: BankAddRowProps) {
  const [name, setName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  function submit() {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
    nameRef.current?.focus();
  }

  return (
    <TableRow
      className={`
        transition-colors duration-500
        ${
          isHighlighted
            ? "bg-[var(--color-success-soft)]"
            : "bg-[var(--color-primary-soft)]"
        }
      `}
    >
      <TableCell colSpan={3} className="p-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-muted)]">New</span>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Add a bank account — press Enter to add and continue"
            className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-all duration-200"
          />
          <Button onClick={submit}>Add +</Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
    