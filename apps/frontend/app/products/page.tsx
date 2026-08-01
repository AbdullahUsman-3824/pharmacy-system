"use client";

import { ProductsTable } from "@/components/features/products/ProductsTable";
import { ProductsTabs } from "@/components/features/products/ProductsTabs";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  return (
    <PageContainer>
      <PageHeader
        title="Products Catalog"
        description="Maintain your product catalog and related information."
      >
        <Button onClick={() => router.push("/products/new")}>
          <Plus size={16} />
          Add Product
        </Button>
      </PageHeader>
      <PageSection>
        <ProductsTabs />
        <ProductsTable />
      </PageSection>
    </PageContainer>
  );
}
