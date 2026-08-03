import { ShortcutCommand } from "./types";

class CommandRegistry {
  private commands = new Map<string, ShortcutCommand>();

  register(command: ShortcutCommand) {
    this.commands.set(command.id, command);
  }

  unregister(id: string) {
    this.commands.delete(id);
  }

  getAll() {
    return Array.from(this.commands.values());
  }

  findByShortcut(shortcut: string) {
    return this.getAll()
      .filter((c) => c.shortcut === shortcut && !c.disabled)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
  }
}

export const commandRegistry = new CommandRegistry();
