"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { distributorsApi } from "@/lib/api/distributorsApi";
import type {
  CreateDistributorInput,
  UpdateDistributorInput,
  DistributorsListQuery,
} from "@repo/shared";

export const distributorKeys = {
  all: ["distributors"] as const,
  list: (query: DistributorsListQuery) =>
    [...distributorKeys.all, "list", query] as const,
  detail: (id: string) => [...distributorKeys.all, id] as const,
  options: (search: string) =>
    [...distributorKeys.all, "options", search] as const,
};

export function useDistributors(query: DistributorsListQuery) {
  return useQuery({
    queryKey: distributorKeys.list(query),
    queryFn: () => distributorsApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useDistributorsOptions(search: string) {
  return useQuery({
    queryKey: distributorKeys.options(search),
    queryFn: () => distributorsApi.options(search),
  });
}

export function useDistributor(id: string) {
  return useQuery({
    queryKey: distributorKeys.detail(id),
    queryFn: () => distributorsApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateDistributor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDistributorInput) =>
      distributorsApi.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: distributorKeys.all }),
  });
}

export function useUpdateDistributor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateDistributorInput;
    }) => distributorsApi.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: distributorKeys.all });
      queryClient.invalidateQueries({
        queryKey: distributorKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteDistributor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => distributorsApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: distributorKeys.all }),
  });
}
