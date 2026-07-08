"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import type { LookupEntity, Product } from "@/lib/types";
import { AddProductModal } from "./AddProductModal";

interface ProductsTableProps {
  initialProducts: Product[];
  initialCompanies: LookupEntity[];
  initialTypes: LookupEntity[];
  initialGroups: LookupEntity[];
  initialGenerics: LookupEntity[];
}

function nameFor(list: LookupEntity[], id: string | null) {
  return list.find((item) => item.id === id)?.name ?? "—";
}

export function ProductsTable({
  initialProducts,
  initialCompanies,
  initialTypes,
  initialGroups,
  initialGenerics,
}: ProductsTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [companies, setCompanies] = useState(initialCompanies);
  const [types, setTypes] = useState(initialTypes);
  const [groups, setGroups] = useState(initialGroups);
  const [generics, setGenerics] = useState(initialGenerics);

  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  function addLookup(
    setter: React.Dispatch<React.SetStateAction<LookupEntity[]>>,
    code: string,
    name: string,
  ) {
    const id = crypto.randomUUID();
    setter((prev) => [...prev, { id, code, name }]);
    return id;
  }

  function handleDeleteProduct(id: string) {
    if (confirm("Delete this product?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-card px-4 py-3 shadow-panel">
        <Search size={18} className="text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
        <span className="shrink-0 text-sm text-ink-500">
          {products.length} products
        </span>
        <button
          onClick={() => setModalOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>
      <div className="grid grid-cols-[1fr_140px_120px_120px_100px_40px] gap-3 border-b border-border px-4 py-2 text-sm text-ink-500">
        <span>Name</span>
        <span>Company</span>
        <span>Type</span>
        <span>Generic</span>
        <span className="text-right">Price</span>
        <span />
      </div>

      <div>
        {filtered.map((p) => (
          <div
            key={p.id}
            className="group grid grid-cols-[1fr_140px_120px_120px_100px_40px] items-center gap-3 border-b border-border-soft px-4 py-3 text-sm"
          >
            <span className="font-medium text-ink-900">{p.name}</span>
            <span className="text-ink-700">
              {nameFor(companies, p.companyId)}
            </span>
            <span className="text-ink-700">{nameFor(types, p.typeId)}</span>
            <span className="text-ink-700">
              {nameFor(generics, p.genericId)}
            </span>
            <span className="text-right font-medium text-ink-900">
              Rs {p.retailPrice}
            </span>
            <button
              onClick={() => handleDeleteProduct(p.id)}
              className="justify-self-end text-ink-400 opacity-0 hover:text-danger-strong group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <AddProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        companies={companies}
        types={types}
        groups={groups}
        generics={generics}
        onAddCompany={(code, name) => addLookup(setCompanies, code, name)}
        onAddType={(code, name) => addLookup(setTypes, code, name)}
        onAddGroup={(code, name) => addLookup(setGroups, code, name)}
        onAddGeneric={(code, name) => addLookup(setGenerics, code, name)}
        onSave={(values) => {
          setProducts((prev) => [
            ...prev,
            { id: crypto.randomUUID(), ...values },
          ]);
        }}
      />
    </div>
  );
}
