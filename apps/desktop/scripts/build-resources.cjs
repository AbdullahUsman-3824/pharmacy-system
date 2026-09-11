const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "../../..");
const desktopRoot = path.join(projectRoot, "apps", "desktop");
const resourcesRoot = path.join(desktopRoot, "resources");

function run(command, cwd = projectRoot) {
  console.log(`\n$ ${command}`);
  execSync(command, { cwd, stdio: "inherit" });
}

function removeDir(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copy(source, destination) {
  fs.cpSync(source, destination, { recursive: true, force: true });
}

function assertExists(target, description) {
  if (!fs.existsSync(target)) {
    console.error(`\n✖ ${description} not found:\n${target}`);
    process.exit(1);
  }
}

// ============================================================
// Backend: build + deploy
// ============================================================

console.log("\n=== Building backend ===");
run("pnpm --filter @pharmacy/backend build");

const backendResource = path.join(resourcesRoot, "backend");

console.log("\n=== Deploying backend ===");
removeDir(backendResource);
run(
  `pnpm --filter @pharmacy/backend deploy --prod --legacy --config.node-linker=hoisted "${backendResource}"`,
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

console.log("✔ Backend resources ready");

// ============================================================
// Frontend: build + standalone copy
// ============================================================
console.log("\n=== Building frontend ===");
run("pnpm --filter frontend build");

const frontendRoot = path.join(projectRoot, "apps", "frontend");
const standaloneRuntime = path.join(
  frontendRoot,
  ".next",
  "standalone",
  "apps",
  "frontend",
);

assertExists(path.join(standaloneRuntime, "server.js"), "Frontend server.js");

console.log("\n=== Copying frontend static assets ===");
const staticDest = path.join(standaloneRuntime, ".next", "static");
const publicDest = path.join(standaloneRuntime, "public");

removeDir(staticDest);
copy(path.join(frontendRoot, ".next", "static"), staticDest);

const publicDir = path.join(frontendRoot, "public");
if (fs.existsSync(publicDir)) {
  removeDir(publicDest);
  copy(publicDir, publicDest);
}

// Next.js dynamic requires ke through @next/env aur @swc/helpers ko
// standalone tracing kabhi miss kar deti hai monorepo setups mein,
// isliye ye do package explicitly copy kar rahe hain
console.log("\n=== Ensuring all runtime dependencies are present ===");

function findInPnpmStore(pkgName) {
  const pnpmStoreDir = path.join(projectRoot, "node_modules", ".pnpm");
  if (!fs.existsSync(pnpmStoreDir)) return null;

  const scopedName = pkgName.replace("/", "+");
  const entries = fs.readdirSync(pnpmStoreDir);
  const match = entries.find((entry) => entry.startsWith(`${scopedName}@`));

  if (!match) return null;

  return path.join(pnpmStoreDir, match, "node_modules", pkgName);
}

function ensurePackage(pkg) {
  const destInStandalone = path.join(standaloneRuntime, "node_modules", pkg);

  if (fs.existsSync(destInStandalone)) {
    return; // already present, kuch nahi karna
  }

  let src = path.join(projectRoot, "node_modules", pkg);
  if (!fs.existsSync(src)) {
    src = path.join(frontendRoot, "node_modules", pkg);
  }
  if (!fs.existsSync(src)) {
    src = findInPnpmStore(pkg);
  }

  if (src && fs.existsSync(src)) {
    copy(src, destInStandalone);
    console.log(`  ✔ ${pkg}`);
  } else {
    console.warn(`  ⚠ ${pkg} not found anywhere`);
  }
}

const frontendPkgJson = JSON.parse(
  fs.readFileSync(path.join(frontendRoot, "package.json"), "utf8"),
);

const runtimeDeps = Object.keys(frontendPkgJson.dependencies || {});

// ye do dynamic-require wali cheezein package.json mein list nahi hoti
// (indirect dependencies hain), inhe hamesha explicitly check karo
const alwaysCheck = ["@next/env", "@swc/helpers", ...runtimeDeps];

for (const pkg of alwaysCheck) {
  ensurePackage(pkg);
}

console.log("✔ All dependencies verified/copied");

console.log("\n=== Copying frontend into resources ===");
const frontendResource = path.join(resourcesRoot, "frontend");
removeDir(frontendResource);
copy(standaloneRuntime, frontendResource);

assertExists(path.join(frontendResource, "server.js"), "Frontend server.js");
console.log("✔ Frontend resources ready");

// ============================================================
// Done
// ============================================================

console.log("\n========================================");
console.log("   RESOURCES BUILD COMPLETE");
console.log("========================================");
console.log(`\nBackend:  ${backendResource}`);
console.log(`Frontend: ${frontendResource}`);
