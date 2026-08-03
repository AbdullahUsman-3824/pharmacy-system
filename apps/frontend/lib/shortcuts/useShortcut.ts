"use client";

import { useEffect } from "react";
import { commandRegistry } from "./command-registry";
import { ShortcutCommand } from "./types";

export function useShortcut(command: ShortcutCommand) {
  useEffect(() => {
    commandRegistry.register(command);

    return () => {
      commandRegistry.unregister(command.id);
    };
  }, [command]);
}
