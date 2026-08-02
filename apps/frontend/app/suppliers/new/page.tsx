"use client";

import { useRouter } from "next/navigation";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";

import Button from "@/components/ui/button";

import { SupplierForm } from "@/components/features/suppliers/SupplierForm";

import { useCreateSupplier } from "@/hooks/useSuppliers";

export default function NewSupplierPage() {
  const router = useRouter();

  const { mutate: createSupplier } = useCreateSupplier();

  return (
    <PageContainer>
      <PageHeader title="Add Supplier" description="Create a new supplier.">
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </PageHeader>

      <PageSection>
        <SupplierForm
          onSubmit={(values) =>
            createSupplier(values, {
              onSuccess: () => router.push("/suppliers"),
            })
          }
          onCancel={() => router.back()}
        />
      </PageSection>
    </PageContainer>
  );
}
