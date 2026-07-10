"use client";

import { useMemo, useState } from "react";
import { LookupSearchBar } from "./LookupSearchBar";
import { LookupAddRow } from "./LookupAddRow";
import { LookupRow } from "./LookupRow";
import {
  useLookup,
  useCreateLookup,
  useUpdateLookup,
  useDeleteLookup,
} from "@/hooks/useLookups";
import { LookupType } from "@repo/shared/types/lookups";

interface LookupTableProps {
  type: LookupType;
  entityLabelPlural: string;
  entityLabel: string;
}

export function LookupTable({
  type,
  entityLabelPlural,
  entityLabel,
}: LookupTableProps) {
  const { data: items = [] } = useLookup(type);
  const [query, setQuery] = useState("");

  const { mutate: createLookup } = useCreateLookup(type);
  const { mutate: updateLookup } = useUpdateLookup(type);
  const { mutate: deleteLookup } = useDeleteLookup(type);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  function handleAdd(name: string) {
    createLookup(name); // onSuccess in the hook already invalidates ['lookups', type]
  }

  function handleSave(id: string, name: string) {
    updateLookup({ id, name });
  }

  function handleDelete(id: string) {
    deleteLookup(id);
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
        <div className="grid grid-cols-[48px_1fr_100px] gap-3 border-b border-border px-4 py-2 text-sm text-ink-500">
          <span>#</span>
          <span>Name</span>
          <span />
        </div>

        <LookupAddRow onAdd={handleAdd} entityLabel={entityLabel} />

        <div>
          {filtered.map((item, i) => (
            <LookupRow
              key={item.id}
              index={i + 1}
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
