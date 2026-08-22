"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { paymentAccountApi } from "@/lib/api/paymentAccountApi";
import type {
  CreatePaymentAccount,
  UpdatePaymentAccount,
} from "@repo/shared";

interface PaymentAccountsQuery {
  isActive?: boolean;
}

export const paymentAccountKeys = {
  all: ["payment-accounts"] as const,
  list: (query: PaymentAccountsQuery) =>
    [...paymentAccountKeys.all, "list", query] as const,
  detail: (id: string) => [...paymentAccountKeys.all, id] as const,
  options: () => [...paymentAccountKeys.all, "options"] as const,
};

export function usePaymentAccounts(query: PaymentAccountsQuery = {}) {
  return useQuery({
    queryKey: paymentAccountKeys.list(query),
    queryFn: () => paymentAccountApi.list(query),
  });
}

export function usePaymentOptions() {
  return useQuery({
    queryKey: paymentAccountKeys.options(),
    queryFn: () => paymentAccountApi.options(),
  });
}

export function usePaymentAccount(id: string) {
  return useQuery({
    queryKey: paymentAccountKeys.detail(id),
    queryFn: () => paymentAccountApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreatePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentAccount) =>
      paymentAccountApi.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: paymentAccountKeys.all }),
  });
}

export function useUpdatePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePaymentAccount }) =>
      paymentAccountApi.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentAccountKeys.all });
      queryClient.invalidateQueries({
        queryKey: paymentAccountKeys.detail(variables.id),
      });
    },
  });
}

export function useDeletePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentAccountApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: paymentAccountKeys.all }),
  });
}
