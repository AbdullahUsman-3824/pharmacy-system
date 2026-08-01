"use client";

import { useParams, useRouter } from "next/navigation";

import Button from "@/components/ui/button";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";

import LoadingState from "@/components/shared/loading-state";
import EmptyState from "@/components/shared/empty-state";

import { ProductForm } from "@/components/features/products/ProductForm";

import { useProduct } from "@/hooks/useProducts";

export default function ViewProductPage() {
  const router = useRouter();

  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading, isError } = useProduct(id);

  return (
    <PageContainer>
      <PageHeader
        title={product?.name ?? "Product"}
        description="View product information."
      >
        <Button variant="secondary" onClick={() => router.push("/products")}>
          Back
        </Button>

        {product && (
          <Button onClick={() => router.push(`/products/${id}/edit`)}>
            Edit Product
          </Button>
        )}
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
            mode="view"
            initialData={product}
            onSubmit={() => {}}
            onCancel={() => router.back()}
          />
        )}
      </PageSection>
    </PageContainer>
  );
}
