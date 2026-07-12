import { ProductsTable } from "@/components/products/ProductsTable";
import { ProductsTabs } from "@/components/products/ProductsTabs";

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-4">
      <ProductsTabs />
      <ProductsTable />
    </div>
  );
}
