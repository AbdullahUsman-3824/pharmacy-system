import { PageContainer, PageHeader } from "@/components/layout";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      <PageHeader
        title="System Settings"
        description="Manage pharmacy details, tax configuration, and system preferences."
      />
      {children}
    </PageContainer>
  );
}
