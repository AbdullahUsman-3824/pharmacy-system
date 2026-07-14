import { SuppliersTable } from "@/components/suppliers/SuppliersTable";

export default function SuppliersPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-ink-900">Suppliers</h1>
      <SuppliersTable />
    </div>
  );
}