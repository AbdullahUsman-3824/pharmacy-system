// apps/frontend/app/products/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/ProductForm";
import { useCreateProduct } from "@/hooks/useProducts";

export default function NewProductPage() {
  const router = useRouter();
  const { mutate: createProduct } = useCreateProduct();

  return (
    <div className="mx-auto max-w-4xl p-3">
      <div className="mb-6 flex  justify-between items-center">
        <h1 className="text-xl font-semibold text-ink-900">Add Product</h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-brand hover:text-ink-700"
        >
          ← Back to Products
        </button>
      </div>

      <ProductForm
        onSubmit={(values) => {
          createProduct(values, {
            onSuccess: () => router.push("/products"),
          });
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
