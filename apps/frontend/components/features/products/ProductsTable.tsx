"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useLookup } from "@/hooks/useLookups";
import { LookupEntity, LookupType } from "@repo/shared/types/lookups";
import { SearchBar } from "../../ui/searchBar";
import { ProductDto, ProductListItemDto } from "@repo/shared";

const PAGE_SIZE = 100;

function buildLookupMap(items: LookupEntity[]) {
  return new Map(items.map((item) => [item.id, item.name]));
}

export function ProductsTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useProducts({
    page,
    pageSize: PAGE_SIZE,
    search,
  });
  const products = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  const { mutate: deleteProduct } = useDeleteProduct();

  function handleDelete(id: string) {
    if (confirm("Delete this product?")) {
      deleteProduct(id);
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  const columns: DataTableColumn<ProductListItemDto>[] = [
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
      render: (row) => row.name,
    },
    {
      key: "company",
      title: "Company",
      render: (row) => row.company ?? "—",
    },
    {
      key: "type",
      title: "Type",
      render: (row) => row.type ?? "—",
    },
    {
      key: "generic",
      title: "Generic",
      render: (row) => row.generic ?? "—",
    },
    {
      key: "retailPrice",
      dataKey: "retailPrice",
      title: "Retail Price",
      align: "right",
      width: 140,
      render: (row) =>
        row.retailPrice != null
          ? `Rs ${Number(row.retailPrice).toLocaleString()}`
          : "—",
    },
    {
      key: "actions",
      title: "",
      width: 40,
      align: "center",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row.id);
          }}
          className="text-[var(--color-text-placeholder)] transition-colors hover:text-[var(--color-danger-text)]"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        value={search}
        onChange={handleSearchChange}
        entityLabelPlural="Products"
        count={meta?.total ?? 0}
      />

      <DataTable
        columns={columns}
        data={products}
        loading={isLoading}
        emptyTitle="No products found"
        onRowClick={(row) => router.push(`/products/${row.id}`)}
        emptyDescription="Try adjusting your search."
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
