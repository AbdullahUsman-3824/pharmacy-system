"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { HeldInvoicesProvider } from "@/lib/context/HeldInvoicesContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30s — reasonable for LAN, avoid re-fetch spam on every mount
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <HeldInvoicesProvider>{children}</HeldInvoicesProvider>
    </QueryClientProvider>
  );
}
