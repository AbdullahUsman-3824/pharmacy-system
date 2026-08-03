"use client";

import { useEffect } from "react";
import { commandRegistry } from "./command-registry";
import { ShortcutCommand } from "./types";

export function usePageShortcuts(commands: ShortcutCommand[]) {
  useEffect(() => {
    commands.forEach((c) => commandRegistry.register(c));

    return () => {
      commands.forEach((c) => commandRegistry.unregister(c.id));
    };
  }, [commands]);
}
