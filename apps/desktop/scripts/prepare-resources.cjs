const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const desktopRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(desktopRoot, "../..");

const resourcesRoot = path.join(desktopRoot, "resources");

const backendResource = path.join(resourcesRoot, "backend");
const frontendResource = path.join(resourcesRoot, "frontend");

function log(message) {
  console.log(`\n▶ ${message}`);
}

function success(message) {
  console.log(`✔ ${message}`);
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function run(command, args, cwd) {
  const commandLine = `${command} ${args.join(" ")}`;

  console.log(`\n$ ${commandLine}`);

  const result = spawnSync(commandLine, {
    cwd,
    stdio: "inherit",
    shell: true,
    windowsHide: false,
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    fail(`Command failed with exit code ${result.status}`);
  }
}

function remove(target) {
  fs.rmSync(target, {
    recursive: true,
    force: true,
  });
}

function ensure(target) {
  fs.mkdirSync(target, {
    recursive: true,
  });
}

function assertExists(target, description) {
  if (!fs.existsSync(target)) {
    fail(`${description} not found:\n${target}`);
  }
}

// ============================================================
// Backend
// ============================================================

log("Building backend");

run("pnpm.cmd", ["--dir", "apps/backend", "build"], projectRoot);

assertExists(
  path.join(projectRoot, "apps", "backend", "dist", "src", "main.js"),
  "Backend build",
);

success("Backend build complete");

log("Deploying backend resources");

remove(backendResource); // pnpm deploy requires an empty target folder
run(
  "pnpm.cmd",
  [
    "--filter",
    "@pharmacy/backend",
    "deploy",
    "--prod",
    "--legacy",
    "--config.node-linker=hoisted",
    `"${backendResource}"`,
  ],
  projectRoot,
);

assertExists(
  path.join(backendResource, "dist", "src", "main.js"),
  "Backend dist/src/main.js",
);
assertExists(
  path.join(backendResource, "prisma.config.ts"),
  "Backend prisma.config.ts",
);
assertExists(
  path.join(backendResource, "node_modules", "prisma", "build", "index.js"),
  "Backend prisma CLI",
);

success("Backend resources ready");

// ============================================================
// Frontend
// ============================================================

log("Building frontend");

run("pnpm.cmd", ["--dir", "apps/frontend", "build"], projectRoot);

success("Frontend build complete");

log("Deploying frontend resources");

remove(frontendResource); // pnpm deploy requires an empty target folder
run(
  "pnpm.cmd",
  [
    "--filter",
    "frontend",
    "deploy",
    "--prod",
    "--legacy",
    `"${frontendResource}"`,
  ],
  projectRoot,
);

assertExists(
  path.join(frontendResource, "node_modules", "next", "dist", "bin", "next"),
  "Frontend Next.js CLI",
);
assertExists(
  path.join(frontendResource, ".next"),
  "Frontend .next build output",
);

success("Frontend resources ready");

// ============================================================
// Node
// ============================================================

log("Updating bundled Node");

const nodeSource =
  process.env.PHARMACY_NODE_PATH ||
  path.join(
    process.env.ProgramFiles || "C:\\Program Files",
    "nodejs",
    "node.exe",
  );

const nodeDestination = path.join(resourcesRoot, "node", "node.exe");

assertExists(nodeSource, "Node runtime");

ensure(path.dirname(nodeDestination));

fs.copyFileSync(nodeSource, nodeDestination);

success("Node runtime ready");

// ============================================================
// PostgreSQL
// ============================================================

log("Checking PostgreSQL");

assertExists(
  path.join(resourcesRoot, "postgres", "bin", "postgres.exe"),
  "PostgreSQL postgres.exe",
);

assertExists(
  path.join(resourcesRoot, "postgres", "bin", "initdb.exe"),
  "PostgreSQL initdb.exe",
);

assertExists(
  path.join(resourcesRoot, "postgres", "bin", "pg_ctl.exe"),
  "PostgreSQL pg_ctl.exe",
);

success("PostgreSQL resources ready");

// ============================================================
// Final verification
// ============================================================

console.log("\n========================================");
console.log("     PHARMACYPOS RESOURCES READY");
console.log("========================================");

console.log("\n✔ Backend");
console.log("✔ Frontend");
console.log("✔ Node");
console.log("✔ PostgreSQL");

console.log("\nAll build resources are up to date.");
