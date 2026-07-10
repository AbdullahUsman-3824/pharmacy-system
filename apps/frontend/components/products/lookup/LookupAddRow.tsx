"use client";

import { useRef, useState } from "react";

interface LookupAddRowProps {
  onAdd: (name: string) => void;
  entityLabel: string;
}

export function LookupAddRow({ onAdd, entityLabel }: LookupAddRowProps) {
  const [name, setName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  function submit() {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
    nameRef.current?.focus();
  }

  return (
    <div className="grid grid-cols-[48px_1fr_100px] items-center gap-3 border-b border-border bg-brand-50 px-4 py-3">
      <span />
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={`Add a ${entityLabel} — press Enter to add and continue`}
        className="rounded-lg border border-border bg-surface-card px-3 py-2 text-sm focus:outline-none"
      />
      <button
        onClick={submit}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Add +
      </button>
    </div>
  );
}
