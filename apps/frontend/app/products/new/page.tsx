"use client";

import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";

import { ProductForm } from "@/components/features/products/ProductForm";

import { useCreateProduct } from "@/hooks/useProducts";

export default function NewProductPage() {
  const router = useRouter();

  const { mutateAsync: createProduct } = useCreateProduct();

  return (
    <PageContainer>
      <PageHeader
        title="Add Product"
        description="Create a new medicine in your inventory."
      >
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </PageHeader>

      <PageSection>
        <ProductForm
          mode="create"
          onSubmit={async (values) => {
            await createProduct(values);
          }}
          onCancel={() => router.back()}
        />
      </PageSection>
    </PageContainer>
  );
}
