import { LookupTable } from "@/components/products/lookup/LookupTable";
import { LookupType } from "@repo/shared/types/lookups";


export default function GenericsPage() {
  return (
    <LookupTable
      type={LookupType.Generic}
      entityLabelPlural="generics"
      entityLabel="generic"
    />
  );
}
