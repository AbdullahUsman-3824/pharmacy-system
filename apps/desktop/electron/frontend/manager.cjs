const path = require("node:path");
const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = Number(process.env.PHARMACY_FRONTEND_PORT || 3000);

let frontendProcess = null;

function getFrontendEntry(app) {
  const packaged = app.isPackaged;
  return packaged
    ? path.join(process.resourcesPath, "frontend", "server.js")
    : path.join(
        __dirname,
        "../../../frontend/.next/standalone/apps/frontend/server.js",
      );
}

function getFrontendCwd(app) {
  // server.js ko apne hi folder se chalana zaroori hai,
  // taake ye apni relative .next/static aur public dhoond sake
  return path.dirname(getFrontendEntry(app));
}

function getNodeExecutable(app) {
  const packaged = app.isPackaged;

  return packaged
    ? path.join(process.resourcesPath, "node", "node.exe")
    : "node";
}

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/`, (res) => {
      resolve(res.statusCode < 500); // 404 bhi theek hai, matlab server zinda hai
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

  throw new Error("Frontend did not become ready within 30 seconds.");
}

async function start(app, backendUrl) {
  const entry = getFrontendEntry(app);
  const cwd = getFrontendCwd(app);
  const nodeExe = getNodeExecutable(app);

  console.log("[Frontend] Starting:", nodeExe, entry);

  frontendProcess = spawn(nodeExe, [entry], {
    cwd,
    env: {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      NEXT_PUBLIC_API_URL: backendUrl,
    },
    stdio: "inherit",
    windowsHide: true,
  });

  frontendProcess.once("exit", (code) => {
    console.log(`[Frontend] Process exited with code ${code}`);
    frontendProcess = null;
  });

  await waitUntilReady();
  console.log("[Frontend] Ready on port", PORT);
}

function stop() {
  if (frontendProcess) {
    frontendProcess.kill();
    frontendProcess = null;
  }
}

module.exports = { start, stop, PORT };
