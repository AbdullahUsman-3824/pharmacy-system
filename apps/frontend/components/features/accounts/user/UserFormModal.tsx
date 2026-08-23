"use client";

import { Modal } from "@/components/ui/modal";
import { UserForm } from "./UserForm";
import type { UserFormOutput } from "./userSchema";
import { useCreateUser, useUpdateUser } from "@/hooks/useUser";
import { UserResponse } from "@repo/shared";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: UserResponse | null; // present -> edit mode
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const isEdit = !!user;

  const { mutate: createUser } = useCreateUser();
  const { mutate: updateUser } = useUpdateUser();

  function handleSubmit(values: UserFormOutput) {
    if (isEdit && user) {
      const { pin, ...rest } = values;
      // Only include pin if the user actually typed a new one
      const input = pin ? { ...rest, pin } : rest;
      updateUser({ id: user.id, input }, { onSuccess: onClose });
    } else {
      createUser(values as Required<UserFormOutput>, { onSuccess: onClose });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit User" : "Add User"}
    >
      <UserForm
        mode={isEdit ? "edit" : "create"}
        initialData={user ?? undefined}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
