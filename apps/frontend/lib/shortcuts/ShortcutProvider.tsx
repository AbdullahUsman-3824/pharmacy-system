"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import { commandRegistry } from "./command-registry";
import { normalizeShortcut, GLOBAL_SHORTCUTS } from "./shortcuts";

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    GLOBAL_SHORTCUTS.forEach((shortcut) => {
      commandRegistry.register({
        ...shortcut,
        priority: 100,
        execute: () => router.push(shortcut.path),
      });
    });

    return () => {
      GLOBAL_SHORTCUTS.forEach((shortcut) =>
        commandRegistry.unregister(shortcut.id),
      );
    };
  }, [router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;

      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (typing) return;

      const shortcut = normalizeShortcut(e);

      const command = commandRegistry.findByShortcut(shortcut);

      if (!command) return;

      e.preventDefault();

      command.execute();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return children;
}
