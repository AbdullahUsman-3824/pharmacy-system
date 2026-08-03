"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { HeldInvoicesProvider } from "@/lib/context/HeldInvoicesContext";
import { ShortcutProvider } from "@/lib/shortcuts/ShortcutProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ShortcutProvider>
        <HeldInvoicesProvider>{children}</HeldInvoicesProvider>
      </ShortcutProvider>
    </QueryClientProvider>
  );
}
