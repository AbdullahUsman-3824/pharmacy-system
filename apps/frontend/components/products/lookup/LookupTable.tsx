"use client";

import { useMemo, useState } from "react";
import type { LookupEntity } from "@/lib/types";
import { LookupSearchBar } from "./LookupSearchBar";
import { LookupAddRow } from "./LookupAddRow";
import { LookupRow } from "./LookupRow";

interface LookupTableProps {
  initialItems: LookupEntity[];
  entityLabelPlural: string;
}

export function LookupTable({
  initialItems,
  entityLabelPlural,
}: LookupTableProps) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q),
    );
  }, [items, query]);

  function handleAdd(code: string, name: string) {
    setItems((prev) => [{ id: crypto.randomUUID(), code, name }, ...prev]);
  }

  function handleSave(id: string, code: string, name: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, code, name } : item)),
    );
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <LookupSearchBar
        value={query}
        onChange={setQuery}
        entityLabelPlural={entityLabelPlural}
        count={items.length}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-panel">
        <div className="grid grid-cols-[140px_1fr_100px] gap-3 border-b border-border px-4 py-2 text-sm text-ink-500">
          <span>Code</span>
          <span>Name</span>
          <span />
        </div>

        <LookupAddRow onAdd={handleAdd} />

        <div>
          {filtered.map((item) => (
            <LookupRow
              key={item.id}
              item={item}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
