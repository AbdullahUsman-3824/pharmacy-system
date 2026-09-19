const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const postgres = require("./postgres/manager.cjs");
const backend = require("./backend/manager.cjs");
const frontend = require("./frontend/manager.cjs");
const db = require("./db/manager.cjs");

const { autoUpdater } = require("electron-updater");

const projectRoot = path.resolve(__dirname, "../../..");

let mainWindow = null;
let currentDatabaseUrl = null; // set once services start, used by IPC handlers

// ---------------------------------------------------------------------------
// Auto-updater helpers — once-per-day + silent offline
// ---------------------------------------------------------------------------

const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getLastUpdateCheckPath() {
  return path.join(app.getPath("userData"), "last-update-check");
}

function getLastUpdateCheckTime() {
  try {
    const raw = fs.readFileSync(getLastUpdateCheckPath(), "utf8");
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : 0;
  } catch {
    return 0;
  }
}

function setLastUpdateCheckTime(ts = Date.now()) {
  try {
    fs.writeFileSync(getLastUpdateCheckPath(), String(ts), "utf8");
  } catch (err) {
    console.error("[Updater] Failed to save last check time:", err);
  }
}

function shouldAutoCheckForUpdates() {
  const last = getLastUpdateCheckTime();
  return Date.now() - last >= UPDATE_CHECK_INTERVAL_MS;
}

/** Returns true for typical offline / network errors that should stay silent. */
function isNetworkError(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  return (
    msg.includes("net::") ||
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("network") ||
    msg.includes("internet") ||
    msg.includes("offline") ||
    msg.includes("getaddrinfo")
  );
}

async function runMigrations(app, databaseUrl) {
  const packaged = app.isPackaged;

  const backendRoot = packaged
    ? path.join(process.resourcesPath, "backend")
    : path.join(projectRoot, "apps", "backend");

  const prismaCli = path.join(
    backendRoot,
    "node_modules",
    "prisma",
    "build",
    "index.js",
  );

  const nodeExe = packaged
    ? path.join(process.resourcesPath, "node", "node.exe")
    : "node";

  console.log("[Startup] Running database migrations...");

  execFileSync(nodeExe, [prismaCli, "migrate", "deploy"], {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
    windowsHide: true,
  });
}

// ---------------------------------------------------------------------------
// Database export/import — shared logic called by both the menu and IPC
// ---------------------------------------------------------------------------

async function handleExportDatabase() {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: "Export Database",
    defaultPath: `pharmacy-backup_${new Date().toISOString().slice(0, 10)}.pgdump`,
    filters: [{ name: "PostgreSQL Dump", extensions: ["pgdump"] }],
  });

  if (canceled || !filePath) {
    return { cancelled: true };
  }

  try {
    await db.exportDatabase(app, currentDatabaseUrl, filePath);
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Export Complete",
      message: "Database exported successfully.",
      detail: filePath,
    });
    return { success: true, filePath };
  } catch (error) {
    console.error("[DB] Export failed:", error);
    dialog.showErrorBox("Export Failed", error.message);
    return { success: false, error: error.message };
  }
}

async function handleImportDatabase() {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title: "Import Database",
    filters: [{ name: "PostgreSQL Dump", extensions: ["pgdump"] }],
    properties: ["openFile"],
  });

  if (canceled || !filePaths.length) {
    return { cancelled: true };
  }

  const sourcePath = filePaths[0];

  // Warn the user before overwriting
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: "Confirm Import",
    message: "This will replace all current data.",
    detail:
      "A backup of the current database will be created automatically before the import. Continue?",
    buttons: ["Import", "Cancel"],
    defaultId: 1,
    cancelId: 1,
  });

  if (response !== 0) {
    return { cancelled: true };
  }

  // Show a loading modal while the import runs
  const progressWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    width: 340,
    height: 340,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    title: "Importing…",
    show: false,
    useContentSize: true,
    backgroundColor: "#f6f8fb",
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  progressWindow.loadFile(path.join(__dirname, "loading.html"));
  progressWindow.once("ready-to-show", () => progressWindow.show());

  try {
    const backupPath = await db.importDatabase(
      app,
      currentDatabaseUrl,
      sourcePath,
    );

    progressWindow.destroy();

    await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Import Complete",
      message: "Database imported successfully.",
      detail: `Pre-import backup saved to:\n${backupPath}`,
    });

    // Reload the frontend so all data reflects the restored database
    mainWindow.reload();

    return { success: true, backupPath };
  } catch (error) {
    progressWindow.destroy();
    console.error("[DB] Import failed:", error);
    dialog.showErrorBox("Import Failed", error.message);
    return { success: false, error: error.message };
  }
}

// IPC handlers so the renderer can also trigger these (e.g. from a settings page)
ipcMain.handle("db:export", () => handleExportDatabase());
ipcMain.handle("db:import", () => handleImportDatabase());

// ---------------------------------------------------------------------------

function navigate(route) {
  if (mainWindow) {
    mainWindow.loadURL(`http://127.0.0.1:${frontend.PORT}${route}`);
  }
}

function buildMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Sale",
          accelerator: "F2",
          click: () => navigate("/pos"),
        },
        {
          label: "New Purchase",
          accelerator: "F3",
          click: () => navigate("/stock/new"),
        },
        {
          label: "Add Product",
          accelerator: "F4",
          click: () => navigate("/products/new"),
        },
        { type: "separator" },
        {
          label: "Export Database",
          click: () => handleExportDatabase(),
        },
        {
          label: "Import Database",
          click: () => handleImportDatabase(),
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: "Alt+F4",
          click: () => app.quit(),
        },
      ],
    },

    {
      label: "Navigate",
      submenu: [
        {
          label: "Dashboard",
          accelerator: "F1",
          click: () => navigate("/dashboard"),
        },
        {
          label: "Products",
          accelerator: "Ctrl+P",
          click: () => navigate("/products"),
        },
        {
          label: "Sales",
          click: () => navigate("/sales"),
        },
        {
          label: "Purchases",
          click: () => navigate("/stock"),
        },
        {
          label: "Stock",
          click: () => navigate("/inventory"),
        },
        {
          label: "Distributors",
          accelerator: "Ctrl+U",
          click: () => navigate("/distributors"),
        },
      ],
    },

    {
      label: "Help",
      submenu: [
        {
          label: "Check for Updates",
          click: () => checkForUpdatesManual(),
        },
        { type: "separator" },
        {
          label: "About Furqan Medicos",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              icon: path.join(__dirname, "../build/icon.ico"),
              title: "About Furqan Medicos",
              message: "Furqan Medicos POS",
              detail: `Version ${app.getVersion()}\n\nA pharmacy point-of-sale system.`,
            });
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

// ---------------------------------------------------------------------------
// Auto-updater setup
// ---------------------------------------------------------------------------

/** true = user clicked "Check for Updates"; false = automatic background check */
let updateCheckIsManual = false;

function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log("[Updater] Skipping update check in development.");
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("[Updater] Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log(`[Updater] Update available: ${info.version}`);
    setLastUpdateCheckTime();
    if (updateCheckIsManual) {
      dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Update Available",
        message: `Furqan Medicos ${info.version} is available.`,
        detail:
          "The update is downloading in the background. You will be notified when it is ready to install.",
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[Updater] App is up to date.");
    setLastUpdateCheckTime();
    if (updateCheckIsManual) {
      dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "No Updates",
        message: "You are using the latest version.",
        detail: `Current version: ${app.getVersion()}`,
      });
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log(`[Updater] Downloading: ${progress.percent.toFixed(1)}%`);
  });

  autoUpdater.on("update-downloaded", async (info) => {
    console.log(`[Updater] Update downloaded: ${info.version}`);

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update Ready",
      message: `Furqan Medicos ${info.version} is ready to install.`,
      detail: "The application needs to restart to complete the update.",
      buttons: ["Restart & Update", "Later"],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on("error", (error) => {
    console.error("[Updater] Update error:", error);

    // Automatic checks: always silent on network/offline errors
    if (!updateCheckIsManual || isNetworkError(error)) {
      return;
    }

    // Manual check + non-network error → show message
    dialog.showMessageBox(mainWindow, {
      type: "error",
      title: "Update Check Failed",
      message: "Could not check for updates.",
      detail: error?.message || String(error),
    });
  });

  // Auto-check only if 24h have passed
  if (shouldAutoCheckForUpdates()) {
    updateCheckIsManual = false;
    autoUpdater.checkForUpdates().catch((err) => {
      // Promise rejection (e.g. offline) — keep silent for auto checks
      console.error(
        "[Updater] Auto check failed (silently ignored):",
        err?.message || err,
      );
    });
  } else {
    console.log(
      "[Updater] Skipping auto-check (already checked within last 24 hours).",
    );
  }
}

/** Manual "Check for Updates" from the menu */
function checkForUpdatesManual() {
  if (!app.isPackaged) {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Updates",
      message: "Update checks are disabled in development mode.",
    });
    return;
  }

  updateCheckIsManual = true;
  autoUpdater.checkForUpdates().catch((err) => {
    console.error("[Updater] Manual check failed:", err);
    if (isNetworkError(err)) {
      dialog.showMessageBox(mainWindow, {
        type: "warning",
        title: "No Internet",
        message: "Could not check for updates.",
        detail: "Please check your internet connection and try again.",
      });
    } else {
      dialog.showMessageBox(mainWindow, {
        type: "error",
        title: "Update Check Failed",
        message: "Could not check for updates.",
        detail: err?.message || String(err),
      });
    }
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    icon: path.join(__dirname, "../build/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.on("did-fail-load", (_event, code, description) => {
    console.error(`Failed to load frontend: ${code} - ${description}`);
  });

  await mainWindow.loadURL(`http://127.0.0.1:${frontend.PORT}`);
  Menu.setApplicationMenu(buildMenu());
  mainWindow.show();
}

async function startServices() {
  let databaseUrl;

  if (process.env.PHARMACY_DATABASE_URL) {
    // Dev override: use external database, skip bundled Postgres
    databaseUrl = process.env.PHARMACY_DATABASE_URL;
    console.log(
      "[Startup] Using external database (PHARMACY_DATABASE_URL):",
      databaseUrl,
    );
  } else {
    console.log("[Startup] Starting Postgres...");
    await postgres.start(app);
    databaseUrl = await postgres.getDatabaseUrl(app);
  }

  currentDatabaseUrl = databaseUrl;

  await runMigrations(app, databaseUrl);

  console.log("[Startup] Starting backend...");
  await backend.start(app, databaseUrl);

  console.log("[Startup] Starting frontend...");
  await frontend.start(app, `http://127.0.0.1:${backend.PORT}`);
}

async function stopServices() {
  frontend.stop();
  backend.stop();
  if (!process.env.PHARMACY_DATABASE_URL) {
    await postgres.stop(app);
  }
}

app.whenReady().then(async () => {
  try {
    await startServices();
    await createWindow();

    setupAutoUpdater();

    console.log("[Startup] PharmacyPOS ready.");
  } catch (error) {
    console.error("[Startup] Failed:", error);
    await stopServices();
    app.quit();
  }
});

app.on("before-quit", async (event) => {
  event.preventDefault();
  await stopServices();
  app.exit(0);
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
