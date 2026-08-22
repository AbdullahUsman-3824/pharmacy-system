"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { lookupsApi } from "../lib/api/lookupsApi";
import {
  LookupType,
  LookupsListQuery,
  LookupsListResponse,
} from "@repo/shared";

export const lookupKeys = {
  all: ["lookups"] as const,
  list: (type: LookupType, query: LookupsListQuery) =>
    [...lookupKeys.all, type, "list", query] as const,
  options: (type: LookupType, search: string) =>
    [...lookupKeys.all, type, "options", search] as const,
};

export function useLookup(
  type: LookupType,
  query: LookupsListQuery = {},
  options?: { initialData?: LookupsListResponse },
) {
  return useQuery({
    queryKey: lookupKeys.list(type, query),
    queryFn: () => lookupsApi.list(type, query),
    initialData: options?.initialData,
    placeholderData: keepPreviousData,
  });
}

export function useLookupsOptions(type: LookupType, search: string) {
  return useQuery({
    queryKey: lookupKeys.options(type, search),
    queryFn: () => lookupsApi.options(type, search),
  });
}

export function useCreateLookup(type: LookupType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => lookupsApi.create(type, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...lookupKeys.all, type] });
    },
  });
}

export function useUpdateLookup(type: LookupType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      lookupsApi.update(type, id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...lookupKeys.all, type] });
    },
  });
}

export function useDeleteLookup(type: LookupType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lookupsApi.remove(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...lookupKeys.all, type] });
    },
  });
}
