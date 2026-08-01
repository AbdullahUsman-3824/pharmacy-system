import { ProductsTabs } from "@/components/features/products/ProductsTabs";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      <PageHeader
        title="Products Catalog"
        description="Maintain your product catalog and related information."
      />
      <PageSection>
        <ProductsTabs />
        {children}
      </PageSection>
    </PageContainer>
  );
}
