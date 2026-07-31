import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/axios";
import type { DashboardStatsDto } from "@repo/shared";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardStatsDto>("/dashboard");
      return data;
    },
    // Manual refresh only, as decided — no refetchInterval/polling
    refetchOnWindowFocus: false,
  });
}
