"use client";

import { Dialog } from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { useCreateProduct } from "@/hooks/useProducts";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddProductModal({ open, onClose }: AddProductModalProps) {
  const { mutate: createProduct } = useCreateProduct();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Product"
      widthClassName="max-w-2xl"
    >
      <ProductForm
        onSubmit={(values) => createProduct(values, { onSuccess: onClose })}
        onCancel={onClose}
      />
    </Dialog>
  );
}
