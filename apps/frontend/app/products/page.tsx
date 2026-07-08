import { ProductsTable } from "@/components/products/ProductsTable";
import {
  products,
  companies,
  productTypes,
  productGroups,
  generics,
} from "@/lib/data";

export default function ProductsPage() {
  return (
    <ProductsTable
      initialProducts={products}
      initialCompanies={companies}
      initialTypes={productTypes}
      initialGroups={productGroups}
      initialGenerics={generics}
    />
  );
}
