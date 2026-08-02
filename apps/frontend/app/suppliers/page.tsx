"use client";

import { SuppliersTable } from "@/components/features/suppliers/SuppliersTable";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SuppliersPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <PageHeader
        title="Suppliers"
        description="Maintain your supplier information"
      >
        <Button onClick={() => router.push("/suppliers/new")}>
          <Plus size={16} />
          Add Supplier
        </Button>
      </PageHeader>
      <PageSection>
        <SuppliersTable />
      </PageSection>
    </PageContainer>
  );
}
