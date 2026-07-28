"use client";

import { useMemo, useState } from "react";
import { Combobox } from "./ui/Combobox";
import { useSearchProducts } from "../hooks/useProducts";

interface Props {
  value: string;
  onChange: (id: string, name: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  dataNav?: string;
}

export function ProductSelect({
  value,
  onChange,
  onKeyDown,
  placeholder = "Scan barcode, medicine, generic...",
  className = "",
  dataNav,
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
    const product = products.find((p) => p.id === id);
    if (product) {
      onChange(id, product.name);
    }
    setSearch("");
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
        dataNav={dataNav}
      />
    </div>
  );
}
