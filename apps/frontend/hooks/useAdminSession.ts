"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSessionApi } from "@/lib/api/adminSessionApi";
import type { UnlockAdminInput } from "@repo/shared";

export const adminSessionKeys = {
  all: ["admin-session"] as const,
  status: () => [...adminSessionKeys.all, "status"] as const,
};

export function useAdminSessionStatus() {
  return useQuery({
    queryKey: adminSessionKeys.status(),
    queryFn: () => adminSessionApi.status(),
    // optional: refetch every 30s or on window focus if you want
    // refetchInterval: 30_000,
  });
}

export function useUnlockAdminSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UnlockAdminInput) => adminSessionApi.unlock(input),
    onSuccess: () => {
      // refresh status after successful unlock
      queryClient.invalidateQueries({ queryKey: adminSessionKeys.status() });
    },
  });
}

export function useLockAdminSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminSessionApi.lock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSessionKeys.status() });
    },
  });
}
