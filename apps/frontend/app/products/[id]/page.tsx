"use client";

import { useRouter, useParams } from "next/navigation";
import { ProductForm } from "@/components/features/products/ProductForm";
import { useProduct } from "@/hooks/useProducts";

export default function ViewProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id);

  return (
    <div className="mx-auto max-w-4xl p-3">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-ink-900">
          {product ? product.name : "Product"}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/products`)}
            className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back
          </button>

          {product && (
            <button
              onClick={() => router.push(`/products/${id}/edit`)}
              className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Edit Product
            </button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-sm text-ink-500">Loading product…</p>}

      {isError && (
        <p className="text-sm text-danger-strong">
          Couldn&apos;t load this product.
        </p>
      )}

      {product && (
        <ProductForm
          mode="view"
          initialData={product}
          onSubmit={() => {}}
          onCancel={() => router.back()}
        />
      )}
    </div>
  );
}
