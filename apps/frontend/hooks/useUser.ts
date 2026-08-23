"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api/userApi";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserListQuery,
  VerifyUserPinInput,
} from "@repo/shared";

export const userKeys = {
  all: ["user"] as const,
  list: (query: UserListQuery) => [...userKeys.all, "list", query] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
  verifyPin: () => [...userKeys.all, "verify-pin"] as const,
};

export function useUsers(query: UserListQuery = {}) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => userApi.list(query),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => userApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      userApi.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useVerifyUserPin() {
  return useMutation({
    mutationFn: (input: VerifyUserPinInput) => userApi.verifyPin(input),
  });
}
