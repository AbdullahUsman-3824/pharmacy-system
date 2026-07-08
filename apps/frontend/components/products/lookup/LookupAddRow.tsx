"use client";

import { useRef, useState } from "react";

interface LookupAddRowProps {
  onAdd: (code: string, name: string) => void;
}

export function LookupAddRow({ onAdd }: LookupAddRowProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);

  function submit() {
    if (!code.trim() || !name.trim()) return;
    onAdd(code.trim(), name.trim());
    setCode("");
    setName("");
    codeRef.current?.focus();
  }

  return (
    <div className="grid grid-cols-[140px_1fr_100px] items-center gap-3 border-b border-border bg-brand-50 px-4 py-3">
      <input
        ref={codeRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Code"
        className="rounded-lg border border-border bg-surface-card px-3 py-2 text-sm focus:outline-none"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Company name — press Enter to add and continue"
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