"use client";

import { useRouter } from "next/navigation";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";

import Button from "@/components/ui/button";

import { DistributorForm } from "@/components/features/distributors/DistributorForm";

import { useCreateDistributor } from "@/hooks/useDistributors";

export default function NewDistributorPage() {
  const router = useRouter();

  const { mutate: createDistributor } = useCreateDistributor();

  return (
    <PageContainer>
      <PageHeader
        title="Add Distributor"
        description="Create a new distributor."
      >
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </PageHeader>

      <PageSection>
        <DistributorForm
          onSubmit={(values) =>
            createDistributor(values, {
              onSuccess: () => router.push("/products/distributors"),
            })
          }
          onCancel={() => router.back()}
        />
      </PageSection>
    </PageContainer>
  );
}
