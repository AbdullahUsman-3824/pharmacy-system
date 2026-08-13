"use client";

import { Combobox } from "./ui/Combobox";
import { useDistributors } from "../hooks/useDistributors";

interface Props {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function DistributorSelect({
  value,
  onChange,
  placeholder = "Search distributor...",
  className = "",
}: Props) {
  const { data: distributors, isLoading } = useDistributors();

  const options = (distributors ?? []).map((s) => ({
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
