"use client";

import { DistributorsTable } from "@/components/features/distributors/DistributorsTable";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DistributorsPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <PageHeader
        title="Distributors"
        description="Maintain your distributor information"
      >
        <Button onClick={() => router.push("/products/distributors/new")}>
          <Plus size={16} />
          Add Distributor
        </Button>
      </PageHeader>
      <PageSection>
        <DistributorsTable />
      </PageSection>
    </PageContainer>
  );
}
