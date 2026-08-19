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
import { SearchBar } from "../../../ui/searchBar";
import { Pagination } from "@/components/shared/pagination";
import { LookupAddRow } from "./LookupAddRow";
import { LookupRow } from "./LookupRow";
import {
  useLookup,
  useCreateLookup,
  useUpdateLookup,
  useDeleteLookup,
} from "@/hooks/useLookups";
import { LookupType } from "@repo/shared/types/lookups";

const PAGE_SIZE = 25;

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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useLookup(type, {
    page,
    pageSize: PAGE_SIZE,
    search,
  });
  const items = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  const { mutate: createLookup } = useCreateLookup(type);
  const { mutate: updateLookup } = useUpdateLookup(type);
  const { mutate: deleteLookup } = useDeleteLookup(type);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

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
        value={search}
        onChange={handleSearchChange}
        entityLabelPlural={entityLabelPlural}
        count={meta?.total ?? 0}
      />

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <Table className="min-w-full border-collapse rounded-none" rounded={false}>
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

              {isLoading ? (
                <TableRow className="border-b-0">
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-sm text-[var(--color-text-muted)]"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className="border-b-0">
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-sm text-[var(--color-text-muted)]"
                  >
                    No {entityLabelPlural.toLowerCase()} found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <LookupRow
                    key={item.id}
                    index={(page - 1) * PAGE_SIZE + index + 1}
                    item={item}
                    onSave={handleSave}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {meta && meta.totalPages > 0 && (
          <div className="border-t border-[var(--color-border)] px-4 py-3">
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
              itemsPerPage={meta.pageSize}
              totalItems={meta.total}
            />
          </div>
        )}
      </div>
    </div>
  );
}
