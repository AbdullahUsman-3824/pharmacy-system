"use client";

import { AccountsTabs } from "@/components/features/accounts/AccountsTabs";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      <PageHeader
        title="Accounts"
        description="Manage customer, supplier, and bank accounts."
      />
      <PageSection>
        <AccountsTabs />
        {children}
      </PageSection>
    </PageContainer>
  );
}
