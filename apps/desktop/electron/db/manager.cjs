const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

/**
 * Parse a postgres:// URL into the pieces pg_dump / pg_restore need.
 * Handles both plain passwords and passwords with special characters (URL-encoded).
 */
function parseDatabaseUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port || "5432",
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
  };
}

/**
 * Spawn a process and return a promise that resolves/rejects on exit.
 * stderr is always collected; stdout is streamed to the parent process.
 */
function run(command, args, env) {
  return new Promise((resolve, reject) => {
    console.log("[DB] spawn:", command, args.join(" ")); // temporary debug

    const child = spawn(command, args, {
      env,
      stdio: ["ignore", "inherit", "pipe"],
      windowsHide: true,
    });

    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    child.once("error", (err) => {
      // Make the error much more helpful
      const msg =
        err.code === "UNKNOWN" || err.code === "ENOENT"
          ? `Could not find or launch "${command}". ` +
            `Make sure PostgreSQL client tools (pg_dump / pg_restore) are installed and on PATH, ` +
            `or that the bundled binaries exist at the expected location.\n` +
            `Original error: ${err.message}`
          : err.message;

      reject(new Error(msg));
    });

    child.once("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${path.basename(command)} exited with code ${code}\n${stderr}`.trim(),
          ),
        );
      }
    });
  });
}

/**
 * Resolve the pg_dump / pg_restore executables.
 * Packaged: uses bundled postgres binaries in resources/.
 * Dev (bundled PG): uses resources/postgres/bin.
 * Dev (external DB via PHARMACY_DATABASE_URL): bundled binaries may not exist,
 *   so fall back to whatever is on the system PATH.
 */
function getPgBin(app, exe) {
  const packaged = app.isPackaged;
  const bundledPath = packaged
    ? path.join(process.resourcesPath, "postgres", "bin", exe)
    : path.join(__dirname, "../../resources/postgres/bin", exe);

  if (fs.existsSync(bundledPath)) {
    return bundledPath;
  }

  // Fallback: try system PATH (useful for external Postgres in dev)
  // On Windows we keep the .exe suffix so CreateProcess can find it.
  const systemName =
    process.platform === "win32"
      ? exe.endsWith(".exe")
        ? exe
        : `${exe}.exe`
      : exe.replace(/\.exe$/, "");

  // Optional: you can also try common install locations here if you want.
  // For now we just return the name and let spawn fail with a clear message.
  return systemName;
}

/**
 * Export the current database to a custom-format dump file.
 *
 * @param {Electron.App} app
 * @param {string} databaseUrl  - current DATABASE_URL
 * @param {string} destPath     - full output file path (e.g. /some/dir/backup.pgdump)
 */
async function exportDatabase(app, databaseUrl, destPath) {
  const { host, port, user, password, database } =
    parseDatabaseUrl(databaseUrl);
  const pgDump = getPgBin(app, "pg_dump.exe");

  const args = [
    "-h",
    host,
    "-p",
    port,
    "-U",
    user,
    "-d",
    database,
    "-Fc", // custom format — compressed, suitable for pg_restore
    "-f",
    destPath,
  ];

  await run(pgDump, args, { ...process.env, PGPASSWORD: password });
  console.log("[DB] Export complete:", destPath);
}

/**
 * Import (restore) a .pgdump file into the current database.
 * Automatically creates a timestamped backup of the current data first.
 *
 * @param {Electron.App} app
 * @param {string} databaseUrl  - current DATABASE_URL
 * @param {string} sourcePath   - path to the .pgdump file to restore
 * @returns {string} path of the auto-backup that was created
 */
async function importDatabase(app, databaseUrl, sourcePath) {
  const { host, port, user, password, database } =
    parseDatabaseUrl(databaseUrl);

  const pgDump = getPgBin(app, "pg_dump.exe");
  const pgRestore = getPgBin(app, "pg_restore.exe");

  // --- 1. Auto-backup current database ---
  const backupDir = app.isPackaged
    ? path.join(app.getPath("userData"), "backups")
    : path.join(__dirname, "../../.local/backups");

  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  const backupPath = path.join(backupDir, `pre-import_${timestamp}.pgdump`);

  console.log("[DB] Creating pre-import backup:", backupPath);
  await exportDatabase(app, databaseUrl, backupPath);
  console.log("[DB] Backup complete.");

  // --- 2. Restore the selected dump ---
  // --clean drops existing objects before recreating them
  // --if-exists avoids errors when objects don't exist yet
  // --no-owner / --no-acl skip ownership/privilege statements
  const args = [
    "-h",
    host,
    "-p",
    port,
    "-U",
    user,
    "-d",
    database,
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-acl",
    sourcePath,
  ];

  console.log("[DB] Restoring from:", sourcePath);
  await run(pgRestore, args, { ...process.env, PGPASSWORD: password });
  console.log("[DB] Restore complete.");

  return backupPath;
}

module.exports = { exportDatabase, importDatabase };
