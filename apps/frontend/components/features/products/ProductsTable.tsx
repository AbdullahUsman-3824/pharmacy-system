"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useLookup } from "@/hooks/useLookups";
import { LookupEntity, LookupType } from "@repo/shared/types/lookups";
import { SearchBar } from "../../ui/searchBar";

type Product = ReturnType<typeof useProducts>["data"] extends
  | (infer P)[]
  | undefined
  ? P
  : never;

function buildLookupMap(items: LookupEntity[]) {
  return new Map(items.map((item) => [item.id, item.name]));
}

export function ProductsTable() {
  const { data: products = [], isLoading } = useProducts();

  const { data: companies = [] } = useLookup(LookupType.Company);
  const { data: types = [] } = useLookup(LookupType.ProductType);
  const { data: generics = [] } = useLookup(LookupType.Generic);

  const { mutate: deleteProduct } = useDeleteProduct();

  const [query, setQuery] = useState("");

  const companyMap = useMemo(() => buildLookupMap(companies), [companies]);
  const typeMap = useMemo(() => buildLookupMap(types), [types]);
  const genericMap = useMemo(() => buildLookupMap(generics), [generics]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        (companyMap.get(product.companyId ?? "") ?? "")
          .toLowerCase()
          .includes(q) ||
        (typeMap.get(product.typeId ?? "") ?? "").toLowerCase().includes(q) ||
        (genericMap.get(product.genericId ?? "") ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [products, query, companyMap, typeMap, genericMap]);

  function handleDelete(id: string) {
    if (confirm("Delete this product?")) {
      deleteProduct(id);
    }
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: "index",
      title: "#",
      width: 60,
      render: (_row, index) => index + 1,
    },
    {
      key: "name",
      dataKey: "name",
      title: "Name",
      render: (row) => (
        <Link
          href={`/products/${row.id}`}
          className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
          onClick={(e) => e.stopPropagation()}
        >
          {row.name}
        </Link>
      ),
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
        onChange={setQuery}
        entityLabelPlural="Products"
        count={filtered.length}
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        emptyTitle="No products found"
        emptyDescription="Try adjusting your search."
      />
    </div>
  );
}
