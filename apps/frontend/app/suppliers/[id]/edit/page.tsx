"use client";

import { useParams, useRouter } from "next/navigation";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";

import Button from "@/components/ui/button";

import LoadingState from "@/components/shared/loading-state";
import EmptyState from "@/components/shared/empty-state";

import { SupplierForm } from "@/components/features/suppliers/SupplierForm";

import { useSupplier, useUpdateSupplier } from "@/hooks/useSuppliers";

export default function EditSupplierPage() {
  const router = useRouter();

  const { id } = useParams<{ id: string }>();

  const { data: supplier, isLoading, isError } = useSupplier(id);

  const { mutate: updateSupplier } = useUpdateSupplier();

  return (
    <PageContainer>
      <PageHeader
        title="Edit Supplier"
        description="Update supplier information."
      >
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </PageHeader>

      <PageSection>
        {isLoading && <LoadingState />}

        {(isError || !supplier) && !isLoading && (
          <EmptyState
            title="Supplier not found"
            description="The requested supplier could not be loaded."
          />
        )}

        {supplier && (
          <SupplierForm
            defaultValues={supplier}
            submitLabel="Update Supplier"
            onSubmit={(values) =>
              updateSupplier(
                {
                  id: supplier.id,
                  input: values,
                },
                {
                  onSuccess: () => router.push("/suppliers"),
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
