const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const postgres = require("./postgres/manager.cjs");
const backend = require("./backend/manager.cjs");
const frontend = require("./frontend/manager.cjs");

const projectRoot = path.resolve(__dirname, "../../..");

let mainWindow = null;

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
  mainWindow.show();
}

async function startServices() {
  console.log("[Startup] Starting Postgres...");
  await postgres.start(app);

  const databaseUrl = await postgres.getDatabaseUrl(app);

  await runMigrations(app, databaseUrl);

  console.log("[Startup] Starting backend...");
  await backend.start(app, databaseUrl);

  console.log("[Startup] Starting frontend...");
  await frontend.start(app, `http://127.0.0.1:${backend.PORT}`);
}

async function stopServices() {
  frontend.stop();
  backend.stop();
  await postgres.stop(app);
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
