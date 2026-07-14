"use client";

import { useRouter } from "next/navigation";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { useCreateSupplier } from "@/hooks/useSuppliers";

export default function NewSupplierPage() {
  const router = useRouter();
  const { mutate: createSupplier } = useCreateSupplier();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Add Supplier</h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-ink-500 hover:text-ink-700"
        >
          ← Back to Suppliers
        </button>
      </div>

      <SupplierForm
        onSubmit={(values) =>
          createSupplier(values, { onSuccess: () => router.push("/suppliers") })
        }
        onCancel={() => router.back()}
      />
    </div>
  );
}
