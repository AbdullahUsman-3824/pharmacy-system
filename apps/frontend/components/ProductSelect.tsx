"use client";

import { Combobox } from "./ui/Combobox";
import { useProducts } from "../hooks/useProducts";
import { Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function ProductSelect({
  value,
  onChange,
  placeholder = "Search product...",
  className = "",
}: Props) {
  const { data: products, isLoading } = useProducts();

  const options = (products ?? []).map((p) => ({
    id: p.id,
    label: p.name,
  }));

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Combobox
        value={value}
        onChange={onChange}
        options={options}
        isLoading={isLoading}
        placeholder={placeholder}
      />
    </div>
  );
}
