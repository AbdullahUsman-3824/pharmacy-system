export interface ShortcutCommand {
  id: string;
  shortcut: string;
  description: string;
  execute: () => void;
  priority?: number;
  disabled?: boolean;
}

export interface GlobalShortcut {
  id: string;
  shortcut: string;
  description: string;
  path: string;
}
