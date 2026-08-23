"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  userSchema,
  type UserFormInput,
  type UserFormOutput,
} from "./userSchema";
import { UserResponse, UserType } from "@repo/shared";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import Input from "@/components/ui/input";

export type UserFormMode = "create" | "edit";

interface UserFormProps {
  mode: UserFormMode;
  initialData?: UserResponse;
  onSubmit: (values: UserFormOutput) => void | Promise<void>;
  onCancel: () => void;
}

const DEFAULT_VALUES: Partial<UserFormInput> = {
  isActive: true,
  type: UserType.STAFF,
  pin: "",
};

function toFormValues(user?: UserResponse): Partial<UserFormInput> {
  if (!user) return DEFAULT_VALUES;
  return {
    name: user.name,
    type: user.type,
    isActive: user.isActive,
    pin: "", // always blank on edit — user types only if resetting
  };
}

export function UserForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormInput, object, UserFormOutput>({
    resolver: zodResolver(userSchema(mode)),
    defaultValues: toFormValues(initialData),
  });

  useEffect(() => {
    if (initialData) {
      reset(toFormValues(initialData));
    }
  }, [initialData, reset]);

  async function submit(values: UserFormOutput) {
    try {
      await onSubmit(values);
      reset();
    } catch {
      // Keep values intact so the user can fix the error.
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Input
        label="Name *"
        placeholder="e.g. Ali Raza"
        error={errors.name?.message}
        {...register("name")}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={mode === "edit" ? "New PIN" : "PIN *"}
          type="password"
          inputMode="numeric"
          placeholder={mode === "edit" ? "Leave blank to keep current" : "••••"}
          error={errors.pin?.message}
          {...register("pin")}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text)]">
            Type *
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-all duration-200"
              >
                <option value={UserType.STAFF}>Staff</option>
                <option value={UserType.OWNER}>Owner</option>
              </select>
            )}
          />
          {errors.type?.message && (
            <p className="text-xs text-[var(--color-danger-text)]">
              {errors.type.message}
            </p>
          )}
        </div>
      </div>

      <Checkbox label="Active" {...register("isActive")} />

      <div className="mt-1 flex flex-col gap-3 border-t border-[var(--color-border-light)] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {mode === "edit" ? "Update User" : "Save User"}
        </Button>
      </div>
    </form>
  );
}
