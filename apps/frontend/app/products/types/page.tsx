import { LookupTable } from "@/components/products/lookup/LookupTable";
import { productTypes } from "@/lib/data";

export default function TypesPage() {
  return <LookupTable initialItems={productTypes} entityLabelPlural="types" />;
}