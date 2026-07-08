import { LookupTable } from "@/components/products/lookup/LookupTable";
import { generics } from "@/lib/data";

export default function GenericsPage() {
  return <LookupTable initialItems={generics} entityLabelPlural="generics" />;
}