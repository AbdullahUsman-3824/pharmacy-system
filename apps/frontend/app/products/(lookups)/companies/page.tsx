"use client";

import { LookupTable } from "@/components/features/products/lookup/LookupTable";
import { LookupType } from "@repo/shared/types/lookups";

export default function CompaniesPage() {
  return (
    <LookupTable
      type={LookupType.Company}
      entityLabelPlural="companies"
      entityLabel="company"
    />
  );
}
