const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const postgres = require("./postgres/manager.cjs");
const backend = require("./backend/manager.cjs");
const frontend = require("./frontend/manager.cjs");
const db = require("./db/manager.cjs");

const projectRoot = path.resolve(__dirname, "../../..");

let mainWindow = null;
let currentDatabaseUrl = null; // set once services start, used by IPC handlers

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
        // {
        //   label: "Keyboard Shortcuts",
        //   click: () => {
        //     // Replace this with your renderer navigation/event
        //     navigate("/shortcuts");
        //   },
        // },
        // { type: "separator" },
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
