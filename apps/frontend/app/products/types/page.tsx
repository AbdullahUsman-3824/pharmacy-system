import { LookupTable } from "@/components/products/lookup/LookupTable";
import { LookupType } from "@repo/shared/types/lookups";

export default function TypesPage() {
  return (
    <LookupTable
      type={LookupType.ProductType}
      entityLabelPlural="types"
      entityLabel="type"
    />
  );
}
