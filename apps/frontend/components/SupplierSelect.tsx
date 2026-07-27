"use client";

import { Combobox } from "./ui/Combobox";
import { useSuppliers } from "../hooks/useSuppliers";

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
  className = "",
}: Props) {
  const { data: suppliers, isLoading } = useSuppliers();

  const options = (suppliers ?? []).map((s) => ({
    id: s.id,
    label: s.name,
  }));

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
