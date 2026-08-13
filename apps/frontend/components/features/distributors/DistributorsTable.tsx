"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { useDistributors, useDeleteDistributor } from "@/hooks/useDistributors";
import { SearchBar } from "@/components/ui/searchBar";

type Distributor = ReturnType<typeof useDistributors>["data"] extends
  | (infer S)[]
  | undefined
  ? S
  : never;

export function DistributorsTable() {
  const router = useRouter();
  const { data: distributors = [], isLoading } = useDistributors();
  const { mutate: deleteDistributor } = useDeleteDistributor();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return distributors;
    return distributors.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.contactPerson?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q),
    );
  }, [distributors, query]);

  function handleDelete(id: string) {
    if (confirm("Delete this distributor?")) {
      deleteDistributor(id);
    }
  }

  const columns: DataTableColumn<Distributor>[] = [
    {
      key: "name",
      dataKey: "name",
      title: "Name",
      render: (row) => (
        <span className="font-medium text-[var(--color-text)]">{row.name}</span>
      ),
    },
    {
      key: "contactPerson",
      dataKey: "contactPerson",
      title: "Contact Person",
      width: 160,
      render: (row) => row.contactPerson ?? "—",
    },
    {
      key: "phone",
      dataKey: "phone",
      title: "Phone",
      width: 140,
      render: (row) => row.phone ?? "—",
    },
    {
      key: "email",
      dataKey: "email",
      title: "Email",
      render: (row) => row.email ?? "—",
    },
    {
      key: "city",
      dataKey: "city",
      title: "City",
      width: 120,
      render: (row) => row.city ?? "—",
    },
    {
      key: "actions",
      title: "",
      width: 80,
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/products/distributors/${row.id}/edit`);
            }}
            className="text-[var(--color-text-placeholder)] transition-colors hover:text-[var(--color-primary)]"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="text-[var(--color-text-placeholder)] transition-colors hover:text-[var(--color-danger-text)]"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        value={query}
        onChange={setQuery}
        count={filtered.length}
        entityLabelPlural="Distributors"
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        emptyTitle="No distributors found"
        emptyDescription="Try adjusting your search."
      />
    </div>
  );
}
