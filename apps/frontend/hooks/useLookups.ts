"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lookupsApi } from "../lib/api/lookupsApi";
import { LookupType, LookupEntity } from "@repo/shared/types/lookups";

export function useLookup(
  type: LookupType,
  options?: { initialData?: LookupEntity[] },
) {
  return useQuery({
    queryKey: ["lookups", type],
    queryFn: () => lookupsApi.list(type),
    initialData: options?.initialData,
  });
}

export function useCreateLookup(type: LookupType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => lookupsApi.create(type, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookups", type] });
    },
  });
}

export function useUpdateLookup(type: LookupType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      lookupsApi.update(type, id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookups", type] });
    },
  });
}

export function useDeleteLookup(type: LookupType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lookupsApi.remove(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookups", type] });
    },
  });
}
