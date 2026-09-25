"use client";

import { Modal } from "@/components/ui/modal";
import { UserForm } from "./UserForm";
import type { UserFormOutput } from "./userSchema";
import { useCreateUser, useUpdateUser } from "@/hooks/useUser";
import { useAdminPinModal } from "@/lib/context/AdminPinModalProvider";
import { UserResponse } from "@repo/shared";
import { toast } from "sonner";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: UserResponse | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAdminLockedError(error: any): boolean {
  return (
    error?.response?.status === 401 &&
    error?.response?.data?.code === "ADMIN_LOCKED"
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getErrorMessage(error: any): string {
  const msg = error?.response?.data?.message;

  if (Array.isArray(msg)) return msg[0]; // validation errors
  if (typeof msg === "string") return msg;

  return error?.message || "Something went wrong";
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const isEdit = !!user;

  const { mutateAsync: createUser } = useCreateUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  const { requestAdminUnlock } = useAdminPinModal();

  async function handleSubmit(values: UserFormOutput) {
    try {
      if (isEdit && user) {
        const { pin, ...rest } = values;
        const input = pin ? { ...rest, pin } : rest;
        await updateUser({ id: user.id, input });
      } else {
        await createUser(values as Required<UserFormOutput>);
      }
      onClose();
    } catch (error) {
      // 1. Admin locked → PIN modal, no toast
      if (isAdminLockedError(error)) {
        try {
          await requestAdminUnlock();
          await handleSubmit(values); // retry
        } catch {
          // user cancelled PIN modal
        }
        return;
      }

      // 2. Baaki errors → toast
      toast.error(getErrorMessage(error));
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
