"use client";

import { useRouter, useParams } from "next/navigation";
import { ProductForm } from "@/components/products/ProductForm";
import { useProduct, useUpdateProduct } from "@/hooks/useProducts";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id);
  const { mutate: updateProduct } = useUpdateProduct();

  return (
    <div className="mx-auto max-w-4xl p-3">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-ink-900">Edit Product</h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-brand hover:text-ink-700"
        >
          ← Back
        </button>
      </div>

      {isLoading && <p className="text-sm text-ink-500">Loading product…</p>}

      {isError && (
        <p className="text-sm text-danger-strong">
          Couldn&apos;t load this product.
        </p>
      )}

      {product && (
        <ProductForm
          mode="edit"
          initialData={product}
          onSubmit={(values) => {
            updateProduct(
              { id, input: values },
              { onSuccess: () => router.push(`/products/${id}`) },
            );
          }}
          onCancel={() => router.back()}
        />
      )}
    </div>
  );
}
