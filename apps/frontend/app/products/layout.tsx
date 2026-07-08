import { ProductsTabs } from "@/components/products/ProductsTabs";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <ProductsTabs />
      {children}
    </div>
  );
}