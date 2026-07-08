import { Dialog } from "@/components/ui/Dialog";
import { ProductForm } from "./ProductForm";
import type { LookupEntity, Product } from "@/lib/types";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  companies: LookupEntity[];
  types: LookupEntity[];
  groups: LookupEntity[];
  generics: LookupEntity[];
  onAddCompany: (code: string, name: string) => string;
  onAddType: (code: string, name: string) => string;
  onAddGroup: (code: string, name: string) => string;
  onAddGeneric: (code: string, name: string) => string;
  onSave: (product: Omit<Product, "id">) => void;
}

export function AddProductModal({
  open,
  onClose,
  companies,
  types,
  groups,
  generics,
  onAddCompany,
  onAddType,
  onAddGroup,
  onAddGeneric,
  onSave,
}: AddProductModalProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Add Product" widthClassName="max-w-2xl">
      <ProductForm
        companies={companies}
        types={types}
        groups={groups}
        generics={generics}
        onAddCompany={onAddCompany}
        onAddType={onAddType}
        onAddGroup={onAddGroup}
        onAddGeneric={onAddGeneric}
        onSubmit={(values) => {
          onSave(values);
          onClose();
        }}
        onCancel={onClose}
      />
    </Dialog>
  );
}