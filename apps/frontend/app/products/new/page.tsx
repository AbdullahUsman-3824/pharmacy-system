"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/features/products/ProductForm";
import { useCreateProduct } from "@/hooks/useProducts";

export default function NewProductPage() {
  const router = useRouter();
  const { mutateAsync: createProduct } = useCreateProduct();

  return (
    <div className="mx-auto max-w-4xl p-3">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Add Product</h1>

        <button
          onClick={() => router.back()}
          className="text-sm text-brand hover:text-ink-700"
        >
          ← Back to Products
        </button>
      </div>

      <ProductForm
        mode="create"
        onSubmit={async (values) => {
          await createProduct(values);
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
