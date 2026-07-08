import { LookupTable } from "@/components/products/lookup/LookupTable";
import { productGroups } from "@/lib/data";

export default function GroupsPage() {
  return <LookupTable initialItems={productGroups} entityLabelPlural="groups" />;
}