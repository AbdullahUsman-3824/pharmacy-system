"use client";

import { Combobox } from "./ui/Combobox";
import { useSuppliers } from "../hooks/useSuppliers";
import { Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function SupplierSelect({ 
  value, 
  onChange, 
  placeholder = "Search supplier...",
  className = "" 
}: Props) {
  const { data: suppliers, isLoading } = useSuppliers();

  const options = (suppliers ?? []).map((s) => ({
    id: s.id,
    label: s.name,
  }));

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          Loading suppliers...
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
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