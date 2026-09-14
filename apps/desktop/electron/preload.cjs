const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Trigger a database export from the renderer (e.g. a UI button).
   * The main process will open a folder-picker dialog and run pg_dump.
   * @returns {Promise<{ success: boolean, filePath?: string, error?: string, cancelled?: boolean }>}
   */
  exportDatabase: () => ipcRenderer.invoke("db:export"),

  /**
   * Trigger a database import from the renderer (e.g. a UI button).
   * The main process will open a file-picker dialog, warn the user,
   * auto-backup, then run pg_restore.
   * @returns {Promise<{ success: boolean, backupPath?: string, error?: string, cancelled?: boolean }>}
   */
  importDatabase: () => ipcRenderer.invoke("db:import"),
});
