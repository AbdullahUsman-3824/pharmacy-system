const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const PG_PORT = Number(process.env.PHARMACY_PG_PORT || 55432);
const PG_USER = "postgres";
const PG_DATABASE = "pharmacypos";

function getPaths(app) {
  const packaged = app.isPackaged;

  const binariesRoot = packaged
    ? path.join(process.resourcesPath, "postgres")
    : path.join(__dirname, "../../resources/postgres");

  const dataRoot = packaged
    ? path.join(app.getPath("userData"), "postgres", "data")
    : path.join(__dirname, "../../.local/postgres-data");

  const configRoot = packaged
    ? path.join(app.getPath("userData"), "postgres", "config")
    : path.join(__dirname, "../../.local");

  return {
    binariesRoot,
    bin: path.join(binariesRoot, "bin"),
    data: dataRoot,
    config: configRoot,
    postgres: path.join(binariesRoot, "bin", "postgres.exe"),
    pgCtl: path.join(binariesRoot, "bin", "pg_ctl.exe"),
    pgIsReady: path.join(binariesRoot, "bin", "pg_isready.exe"),
    initdb: path.join(binariesRoot, "bin", "initdb.exe"),
    createdb: path.join(binariesRoot, "bin", "createdb.exe"),
  };
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.once("error", reject);

    child.once("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `${path.basename(command)} exited with code ${code}\n${
              stderr || stdout
            }`,
          ),
        );
      }
    });
  });
}
function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readOrCreatePassword(configDir) {
  ensureDirectory(configDir);

  const passwordFile = path.join(configDir, "db-password");

  if (fs.existsSync(passwordFile)) {
    return fs.readFileSync(passwordFile, "utf8").trim();
  }

  const password = crypto.randomBytes(32).toString("base64url");
  fs.writeFileSync(passwordFile, password, { encoding: "utf8" });

  return password;
}

async function isInitialized(paths) {
  return fs.existsSync(path.join(paths.data, "PG_VERSION"));
}

async function isRunning(paths) {
  if (!fs.existsSync(paths.pgIsReady)) {
    return false;
  }

  try {
    await run(paths.pgIsReady, [
      "-h",
      "127.0.0.1",
      "-p",
      String(PG_PORT),
      "-U",
      PG_USER,
      "-d",
      "postgres",
    ]);
    return true;
  } catch {
    return false;
  }
}

async function initialize(app) {
  const paths = getPaths(app);

  for (const executable of [
    paths.initdb,
    paths.pgCtl,
    paths.pgIsReady,
    paths.createdb,
  ]) {
    if (!fs.existsSync(executable)) {
      throw new Error(`PostgreSQL binary not found: ${executable}`);
    }
  }

  ensureDirectory(paths.data);
  ensureDirectory(paths.config);

  console.log("[Postgres] data initialized:", await isInitialized(paths));
  if (await isInitialized(paths)) {
    return paths;
  }

  const password = readOrCreatePassword(paths.config);
  console.log("[DEBUG initdb] config path:", paths.config);
  console.log("[DEBUG initdb] password length:", password.length);
  console.log("[DEBUG initdb] password first 5 chars:", password.slice(0, 5));

  const passwordFile = path.join(paths.config, ".initdb-password");

  fs.writeFileSync(passwordFile, password, { encoding: "utf8" });

  try {
    await run(paths.initdb, [
      "-D",
      paths.data,
      "-U",
      PG_USER,
      "--pwfile",
      passwordFile,
      "--auth-host=scram-sha-256",
      "--auth-local=scram-sha-256",
      "--encoding=UTF8",
    ]);
  } finally {
    fs.rmSync(passwordFile, { force: true });
  }

  return paths;
}

async function ensureDatabase(app) {
  const paths = getPaths(app);
  const password = readOrCreatePassword(paths.config);

  console.log("[DEBUG] config path:", paths.config);
  console.log("[DEBUG] password length:", password.length);
  console.log("[DEBUG] password first 5 chars:", password.slice(0, 5));

  try {
    await run(
      paths.createdb,
      ["-h", "127.0.0.1", "-p", String(PG_PORT), "-U", PG_USER, PG_DATABASE],
      {
        cwd: paths.bin,
        env: {
          ...process.env,
          PGPASSWORD: password,
        },
      },
    );
  } catch (error) {
    if (error.message.includes(`database "${PG_DATABASE}" already exists`)) {
      return;
    }

    throw error;
  }
}

async function start(app) {
  const paths = await initialize(app);

  if (!(await isRunning(paths))) {
    await run(
      paths.pgCtl,
      [
        "-D",
        paths.data,
        "-o",
        `-p ${PG_PORT}`,
        "-l",
        path.join(paths.data, "postgres.log"),
        "start",
      ],
      {
        cwd: paths.bin,
        env: {
          ...process.env,
          PGUSER: PG_USER,
        },
        stdio: "ignore",
      },
    );

    await waitUntilReady(paths);
  }

  await ensureDatabase(app);
}

async function waitUntilReady(paths, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isRunning(paths)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("PostgreSQL did not become ready within 30 seconds.");
}

async function stop(app) {
  const paths = getPaths(app);

  if (!fs.existsSync(paths.pgCtl)) {
    return;
  }

  if (!(await isRunning(paths))) {
    return;
  }

  await run(paths.pgCtl, ["-D", paths.data, "-m", "fast", "-w", "stop"]);
}

async function getDatabaseUrl(app) {
  const paths = getPaths(app);
  const password = readOrCreatePassword(paths.config);

  return `postgresql://${encodeURIComponent(PG_USER)}:${encodeURIComponent(password)}@127.0.0.1:${PG_PORT}/${PG_DATABASE}`;
}

module.exports = {
  PG_PORT,
  PG_USER,
  PG_DATABASE,
  getPaths,
  initialize,
  start,
  stop,
  isRunning: async (app) => isRunning(getPaths(app)),
  waitUntilReady: async (app, timeoutMs) =>
    waitUntilReady(getPaths(app), timeoutMs),
  getDatabaseUrl,
};
