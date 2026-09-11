const path = require("node:path");
const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = Number(process.env.PHARMACY_BACKEND_PORT || 3001);

let backendProcess = null;

function getBackendEntry(app) {
  const packaged = app.isPackaged;

  return packaged
    ? path.join(process.resourcesPath, "backend", "dist", "src", "main.js")
    : path.join(__dirname, "../../../backend/dist/src/main.js");
}

function getNodeExecutable(app) {
  const packaged = app.isPackaged;

  // Packaged mode mein bundled Node use karo, dev mode mein system ka node
  return packaged
    ? path.join(process.resourcesPath, "node", "node.exe")
    : "node";
}

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitUntilReady(timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await checkHealth()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error("Backend did not become ready within 30 seconds.");
}

async function start(app, databaseUrl) {
  const entry = getBackendEntry(app);
  const nodeExe = getNodeExecutable(app);

  console.log("[Backend] Starting:", nodeExe, entry);

  backendProcess = spawn(nodeExe, [entry], {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      PORT: String(PORT),
    },
    stdio: "inherit",
    windowsHide: true,
  });

  backendProcess.once("exit", (code) => {
    console.log(`[Backend] Process exited with code ${code}`);
    backendProcess = null;
  });

  await waitUntilReady();
  console.log("[Backend] Ready on port", PORT);
}

function stop() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

module.exports = { start, stop, PORT };
