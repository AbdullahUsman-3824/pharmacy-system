"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { businessContactApi } from "@/lib/api/businessContactApi";
import type {
  BusinessContactType,
  CreateBusinessContact,
  UpdateBusinessContact,
} from "@repo/shared";

interface BusinessContactsQuery {
  type?: BusinessContactType;
  search?: string;
  isActive?: boolean;
}

export const businessContactKeys = {
  all: ["business-contacts"] as const,
  list: (query: BusinessContactsQuery) =>
    [...businessContactKeys.all, "list", query] as const,
  detail: (id: string) => [...businessContactKeys.all, id] as const,
  supplierOptions: (search?: string) =>
    [...businessContactKeys.all, "supplier-options", search] as const,
  customerOptions: (search?: string) =>
    [...businessContactKeys.all, "customer-options", search] as const,
};

export function useBusinessContacts(query: BusinessContactsQuery = {}) {
  return useQuery({
    queryKey: businessContactKeys.list(query),
    queryFn: () => businessContactApi.list(query),
  });
}

export function useSupplierOptions(search?: string) {
  return useQuery({
    queryKey: businessContactKeys.supplierOptions(search),
    queryFn: () => businessContactApi.supplierOptions(search),
  });
}

export function useCustomersOptions(search: string) {
  return useQuery({
    queryKey: businessContactKeys.customerOptions(search),
    queryFn: () => businessContactApi.customerOptions(search),
    enabled: search.trim().length >= 2,
  });
}

export function useBusinessContact(id: string) {
  return useQuery({
    queryKey: businessContactKeys.detail(id),
    queryFn: () => businessContactApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateBusinessContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBusinessContact) =>
      businessContactApi.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: businessContactKeys.all }),
  });
}

export function useUpdateBusinessContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBusinessContact }) =>
      businessContactApi.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: businessContactKeys.all });
      queryClient.invalidateQueries({
        queryKey: businessContactKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteBusinessContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => businessContactApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: businessContactKeys.all }),
  });
}
