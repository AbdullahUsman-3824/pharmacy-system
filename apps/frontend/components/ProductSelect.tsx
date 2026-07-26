"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Combobox } from "./ui/Combobox";
import { useSearchProducts } from "../hooks/useProducts";

interface Props {
  value: string;
  onChange: (id: string, name: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export function ProductSelect({
  value,
  onChange,
  onKeyDown,
  placeholder = "Scan barcode, medicine, generic...",
  className = "",
}: Props) {
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useSearchProducts(search);

  const options = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        label: p.name,
      })),
    [products],
  );

  const handleChange = (id: string) => {
    setSearch("");
    const product = products.find((p) => p.id === id);
    if (product) {
      onChange(id, product.name);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Combobox
        value={value}
        options={options}
        onChange={handleChange}
        search={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
      />

      {isLoading && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500" />
      )}
    </div>
  );
}
