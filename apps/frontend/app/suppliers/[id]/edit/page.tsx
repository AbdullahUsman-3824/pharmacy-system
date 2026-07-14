"use client";

import { useRouter, useParams } from "next/navigation";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { useSupplier, useUpdateSupplier } from "@/hooks/useSuppliers";

export default function EditSupplierPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: supplier, isLoading } = useSupplier(id);
  const { mutate: updateSupplier } = useUpdateSupplier();

  if (isLoading) return <div className="p-6 text-sm text-ink-400">Loading...</div>;
  if (!supplier) return <div className="p-6 text-sm text-ink-400">Supplier not found</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Edit Supplier</h1>
        <button onClick={() => router.back()} className="text-sm text-ink-500 hover:text-ink-700">
          ← Back to Suppliers
        </button>
      </div>

      <SupplierForm
        defaultValues={supplier}
        submitLabel="Update Supplier"
        onSubmit={(values) =>
          updateSupplier(
            { id: supplier.id, input: values },
            { onSuccess: () => router.push("/suppliers") },
          )
        }
        onCancel={() => router.back()}
      />
    </div>
  );
}