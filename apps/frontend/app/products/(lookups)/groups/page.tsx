import { LookupTable } from "@/components/products/lookup/LookupTable";
import { LookupType } from "@repo/shared/types/lookups";

export default function GroupsPage() {
  return (
    <LookupTable
      type={LookupType.ProductGroup}
      entityLabelPlural="groups"
      entityLabel="group"
    />
  );
}
