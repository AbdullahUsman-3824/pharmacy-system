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
import { ProductDto } from "@repo/shared";

const PAGE_SIZE = 100;

function buildLookupMap(items: LookupEntity[]) {
  return new Map(items.map((item) => [item.id, item.name]));
}

export function ProductsTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading } = useProducts(page, PAGE_SIZE, query);
  const products = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  const { data: companies = [] } = useLookup(LookupType.Company);
  const { data: types = [] } = useLookup(LookupType.ProductType);
  const { data: generics = [] } = useLookup(LookupType.Generic);

  const { mutate: deleteProduct } = useDeleteProduct();

  const companyMap = useMemo(() => buildLookupMap(companies), [companies]);
  const typeMap = useMemo(() => buildLookupMap(types), [types]);
  const genericMap = useMemo(() => buildLookupMap(generics), [generics]);

  function handleDelete(id: string) {
    if (confirm("Delete this product?")) {
      deleteProduct(id);
    }
  }

  function handleSearchChange(value: string) {
    setQuery(value);
    setPage(1); // reset page on new search
  }

  const columns: DataTableColumn<ProductDto>[] = [
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
      render: (row) => companyMap.get(row.companyId ?? "") ?? "—",
    },
    {
      key: "type",
      title: "Type",
      render: (row) => typeMap.get(row.typeId ?? "") ?? "—",
    },
    {
      key: "generic",
      title: "Generic",
      render: (row) => genericMap.get(row.genericId ?? "") ?? "—",
    },
    {
      key: "retailPrice",
      dataKey: "retailPrice",
      title: "Retail Price",
      align: "right",
      width: 140,
      render: (row) => `Rs ${Number(row.retailPrice).toLocaleString()}`,
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
        value={query}
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
              itemsPerPage={meta.limit}
              totalItems={meta.total}
            />
          ) : null
        }
      />
    </div>
  );
}
