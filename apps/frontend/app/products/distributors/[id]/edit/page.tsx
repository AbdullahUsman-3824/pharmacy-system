"use client";

import { useParams, useRouter } from "next/navigation";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";

import Button from "@/components/ui/button";

import LoadingState from "@/components/shared/loading-state";
import EmptyState from "@/components/shared/empty-state";

import { DistributorForm } from "@/components/features/distributors/DistributorForm";

import { useDistributor, useUpdateDistributor } from "@/hooks/useDistributors";

export default function EditDistributorPage() {
  const router = useRouter();

  const { id } = useParams<{ id: string }>();

  const { data: distributor, isLoading, isError } = useDistributor(id);

  const { mutate: updateDistributor } = useUpdateDistributor();

  return (
    <PageContainer>
      <PageHeader
        title="Edit Distributor"
        description="Update distributor information."
      >
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </PageHeader>

      <PageSection>
        {isLoading && <LoadingState />}

        {(isError || !distributor) && !isLoading && (
          <EmptyState
            title="Distributor not found"
            description="The requested distributor could not be loaded."
          />
        )}

        {distributor && (
          <DistributorForm
            defaultValues={distributor}
            submitLabel="Update Distributor"
            onSubmit={(values) =>
              updateDistributor(
                {
                  id: distributor.id,
                  input: values,
                },
                {
                  onSuccess: () => router.push("/products/distributors"),
                },
              )
            }
            onCancel={() => router.back()}
          />
        )}
      </PageSection>
    </PageContainer>
  );
}
