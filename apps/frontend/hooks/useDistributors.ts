"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { distributorsApi } from "@/lib/api/distributorsApi";
import type {
  CreateDistributorInput,
  UpdateDistributorInput,
} from "@repo/shared";

export function useDistributors() {
  return useQuery({
    queryKey: ["distributors"],
    queryFn: distributorsApi.list,
  });
}

export function useDistributor(id: string) {
  return useQuery({
    queryKey: ["distributors", id],
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
      queryClient.invalidateQueries({ queryKey: ["distributors"] }),
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
      queryClient.invalidateQueries({ queryKey: ["distributors"] });
      queryClient.invalidateQueries({
        queryKey: ["distributors", variables.id],
      });
    },
  });
}

export function useDeleteDistributor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => distributorsApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["distributors"] }),
  });
}
