// components/features/accounts/ContactFormModal.tsx
"use client";

import { Modal } from "@/components/ui/modal";
import { ContactForm } from "./ContactForm";
import type { ContactFormOutput } from "./contactSchema";
import {
  useCreateBusinessContact,
  useUpdateBusinessContact,
} from "@/hooks/useBusinessContacts";
import { BusinessContact, BusinessContactType } from "@repo/shared";

interface ContactFormModalProps {
  open: boolean;
  onClose: () => void;
  type: BusinessContactType;
  entityLabel: string;
  contact?: BusinessContact | null;
}

export function ContactFormModal({
  open,
  onClose,
  type,
  entityLabel,
  contact,
}: ContactFormModalProps) {
  const isEdit = !!contact;

  const { mutate: createContact } = useCreateBusinessContact();
  const { mutate: updateContact } = useUpdateBusinessContact();

  function handleSubmit(values: ContactFormOutput) {
    if (isEdit && contact) {
      updateContact({ id: contact.id, input: values }, { onSuccess: onClose });
    } else {
      createContact({ ...values, type }, { onSuccess: onClose });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
    >
      <ContactForm
        mode={isEdit ? "edit" : "create"}
        entityLabel={entityLabel}
        initialData={contact ?? undefined}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
