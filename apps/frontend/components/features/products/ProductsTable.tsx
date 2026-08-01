"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useLookup } from "@/hooks/useLookups";
import { LookupEntity, LookupType } from "@repo/shared/types/lookups";
import { SearchBar } from "./SearchBar";

function buildLookupMap(items: LookupEntity[]) {
  return new Map(items.map((item) => [item.id, item.name]));
}

export function ProductsTable() {
  const { data: products = [] } = useProducts();

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

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        value={query}
        onChange={setQuery}
        entityLabelPlural="Products"
        count={filtered.length}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Generic</TableHead>
            <TableHead className="text-right">Retail Price</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-[var(--color-text-muted)]"
              >
                No products found.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((product, id) => (
              <TableRow key={product.id}>
                <TableCell>{id + 1}</TableCell>
                <TableCell>
                  <Link
                    href={`/products/${product.id}`}
                    className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                  >
                    {product.name}
                  </Link>
                </TableCell>

                <TableCell>
                  {companyMap.get(product.companyId ?? "") ?? "—"}
                </TableCell>

                <TableCell>
                  {typeMap.get(product.typeId ?? "") ?? "—"}
                </TableCell>

                <TableCell>
                  {genericMap.get(product.genericId ?? "") ?? "—"}
                </TableCell>

                <TableCell className="text-right font-medium text-[var(--color-text)]">
                  Rs {Number(product.retailPrice).toLocaleString()}
                </TableCell>

                <TableCell>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-[var(--color-text-placeholder)] transition-colors hover:text-[var(--color-danger-text)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
