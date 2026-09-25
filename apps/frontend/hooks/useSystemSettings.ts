"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { systemSettingsApi } from "@/lib/api/systemSettingsApi";
import type { UpdateSystemSettingsInput } from "@repo/shared";

export const systemSettingsKeys = {
  all: ["system-settings"] as const,
  detail: () => [...systemSettingsKeys.all, "detail"] as const,
};

export function useSystemSettings() {
  return useQuery({
    queryKey: systemSettingsKeys.detail(),
    queryFn: () => systemSettingsApi.get(),
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSystemSettingsInput) =>
      systemSettingsApi.update(input),
    onSuccess: (data) => {
      // Cache update + invalidate
      queryClient.setQueryData(systemSettingsKeys.detail(), data);
      queryClient.invalidateQueries({ queryKey: systemSettingsKeys.all });
    },
  });
}
