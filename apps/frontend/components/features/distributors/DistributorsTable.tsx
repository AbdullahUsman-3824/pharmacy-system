"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { useDistributors, useDeleteDistributor } from "@/hooks/useDistributors";
import { SearchBar } from "@/components/ui/searchBar";
import { DistributorListItem } from "@repo/shared";

const PAGE_SIZE = 25;

export function DistributorsTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useDistributors({
    page,
    pageSize: PAGE_SIZE,
    search,
  });
  const distributors = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  const { mutate: deleteDistributor } = useDeleteDistributor();

  function handleDelete(id: string) {
    if (confirm("Delete this distributor?")) {
      deleteDistributor(id);
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  const columns: DataTableColumn<DistributorListItem>[] = [
    {
      key: "index",
      title: "#",
      width: 60,
      render: (_row, index) => (page - 1) * PAGE_SIZE + index + 1,
    },
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
        value={search}
        onChange={handleSearchChange}
        entityLabelPlural="Distributors"
        count={meta?.total ?? 0}
      />

      <DataTable
        columns={columns}
        data={distributors}
        loading={isLoading}
        emptyTitle="No distributors found"
        emptyDescription="Try adjusting your search."
        onRowClick={(row) => router.push(`/products/distributors/${row.id}`)}
        footer={
          meta && meta.totalPages > 0 ? (
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
              itemsPerPage={meta.pageSize}
              totalItems={meta.total}
            />
          ) : null
        }
      />
    </div>
  );
}
