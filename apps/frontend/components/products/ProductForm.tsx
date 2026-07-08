"use client";

import { useState } from "react";
import { SelectWithQuickAdd } from "./SelectWithQuickAdd";
import type { LookupEntity } from "@/lib/types";

interface ProductFormValues {
  name: string;
  companyId: string | null;
  typeId: string | null;
  groupId: string | null;
  genericId: string | null;
  retailPrice: number;
}

interface ProductFormProps {
  companies: LookupEntity[];
  types: LookupEntity[];
  groups: LookupEntity[];
  generics: LookupEntity[];
  onAddCompany: (code: string, name: string) => string;
  onAddType: (code: string, name: string) => string;
  onAddGroup: (code: string, name: string) => string;
  onAddGeneric: (code: string, name: string) => string;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

export function ProductForm({
  companies,
  types,
  groups,
  generics,
  onAddCompany,
  onAddType,
  onAddGroup,
  onAddGeneric,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [genericId, setGenericId] = useState<string | null>(null);
  const [retailPrice, setRetailPrice] = useState(0);

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), companyId, typeId, groupId, genericId, retailPrice });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm text-ink-500">Product name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Panadol 500mg"
          className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <SelectWithQuickAdd
          label="Company"
          placeholder="Select company"
          options={companies}
          value={companyId}
          onChange={setCompanyId}
          onQuickAdd={onAddCompany}
        />
        <SelectWithQuickAdd
          label="Type"
          placeholder="Select type"
          options={types}
          value={typeId}
          onChange={setTypeId}
          onQuickAdd={onAddType}
        />
        <SelectWithQuickAdd
          label="Group"
          placeholder="Select group"
          options={groups}
          value={groupId}
          onChange={setGroupId}
          onQuickAdd={onAddGroup}
        />
        <SelectWithQuickAdd
          label="Generic"
          placeholder="Select generic"
          options={generics}
          value={genericId}
          onChange={setGenericId}
          onQuickAdd={onAddGeneric}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-ink-500">Retail price (Rs)</label>
        <input
          type="number"
          value={retailPrice}
          onChange={(e) => setRetailPrice(Number(e.target.value))}
          className="w-40 rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-sm focus:outline-none"
        />
      </div>

      <div className="mt-2 flex justify-end gap-3 border-t border-border-soft pt-4">
        <button
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-sunken"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Save Product
        </button>
      </div>
    </div>
  );
}