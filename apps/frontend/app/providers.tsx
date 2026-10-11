"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { HeldInvoicesProvider } from "@/lib/context/HeldInvoicesContext";
import { AdminPinModalProvider } from "@/lib/context/AdminPinModalProvider";
import { ShortcutProvider } from "@/lib/shortcuts/ShortcutProvider";
import { KeyboardProvider } from "@/components/providers/KeyboardProvider";
import { CommandPalette } from "@/components/features/CommandPalette";
import { ShortcutsHelp } from "@/components/features/ShortcutsHelp";

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
      <AdminPinModalProvider>
        {/*
         * KeyboardProvider (new system) wraps ShortcutProvider (legacy) so
         * both window listeners coexist without conflict. The new system uses
         * capture phase; the legacy system uses bubble phase — they don't
         * interfere. Migrate pages from usePageShortcuts → useShortcut
         * incrementally; remove ShortcutProvider once migration is complete.
         *
         * CommandPalette (Ctrl+K) and ShortcutsHelp (F1) are mounted here
         * at the app root so they are available on every page. Both render
         * into document.body via portals and are hidden until triggered.
         */}
        <KeyboardProvider>
          <ShortcutProvider>
            <HeldInvoicesProvider>{children}</HeldInvoicesProvider>
          </ShortcutProvider>

          {/* Discovery overlays — rendered in portals, zero layout impact */}
          <CommandPalette />
          <ShortcutsHelp />
        </KeyboardProvider>
      </AdminPinModalProvider>
    </QueryClientProvider>
  );
}
