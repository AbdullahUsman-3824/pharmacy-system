"use client";

import { useParams, useRouter } from "next/navigation";

import Button from "@/components/ui/button";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";

import LoadingState from "@/components/shared/loading-state";
import EmptyState from "@/components/shared/empty-state";

import { ProductForm } from "@/components/features/products/ProductForm";

import { useProduct, useUpdateProduct } from "@/hooks/useProducts";

export default function EditProductPage() {
  const router = useRouter();

  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading, isError } = useProduct(id);

  const { mutate: updateProduct } = useUpdateProduct();

  return (
    <PageContainer>
      <PageHeader
        title="Edit Product"
        description="Update product information."
      >
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </PageHeader>

      <PageSection>
        {isLoading && <LoadingState />}

        {isError && (
          <EmptyState
            title="Couldn't load product"
            description="Please try again."
          />
        )}

        {product && (
          <ProductForm
            mode="edit"
            initialData={product}
            onSubmit={(values) => {
              updateProduct(
                {
                  id,
                  input: values,
                },
                {
                  onSuccess: () => router.push(`/products/${id}`),
                },
              );
            }}
            onCancel={() => router.back()}
          />
        )}
      </PageSection>
    </PageContainer>
  );
}
