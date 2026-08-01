"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { SearchBar } from "../SearchBar";
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
    createLookup(name);
  }

  function handleSave(id: string, name: string) {
    updateLookup({ id, name });
  }

  function handleDelete(id: string) {
    if (confirm(`Delete this ${entityLabel}?`)) {
      deleteLookup(id);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        value={query}
        onChange={setQuery}
        entityLabelPlural={entityLabelPlural}
        count={items.length}
      />

      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-30" align="center">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <LookupAddRow onAdd={handleAdd} entityLabel={entityLabel} />

            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-[var(--color-text-muted)]"
                >
                  No {entityLabelPlural.toLowerCase()} found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item, index) => (
                <LookupRow
                  key={item.id}
                  index={index + 1}
                  item={item}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
