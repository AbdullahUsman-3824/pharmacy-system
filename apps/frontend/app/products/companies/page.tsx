import { LookupTable } from "@/components/products/lookup/LookupTable";
import { companies } from "@/lib/data";

export default function CompaniesPage() {
  return <LookupTable initialItems={companies} entityLabelPlural="companies" />;
}