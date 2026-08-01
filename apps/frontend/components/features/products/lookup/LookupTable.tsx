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

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <Table className="min-w-full border-collapse">
            <TableHeader className="border-b border-[var(--color-border)] bg-[var(--color-background-muted)]">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="h-12 w-12 px-5 text-sm font-semibold text-[var(--color-text-secondary)]">
                  #
                </TableHead>
                <TableHead className="h-12 px-5 text-sm font-semibold text-[var(--color-text-secondary)]">
                  Name
                </TableHead>
                <TableHead
                  align="center"
                  className="h-12 w-30 px-5 text-center text-sm font-semibold text-[var(--color-text-secondary)]"
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <LookupAddRow onAdd={handleAdd} entityLabel={entityLabel} />

              {filtered.length === 0 ? (
                <TableRow className="border-b-0">
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-sm text-[var(--color-text-muted)]"
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
    </div>
  );
}
