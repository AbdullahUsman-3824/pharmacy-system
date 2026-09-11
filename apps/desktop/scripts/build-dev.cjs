const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "../../..");

function run(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { cwd: projectRoot, stdio: "inherit" });
}

function copy(source, destination) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
}

console.log("\n=== Building backend ===");
run("pnpm --filter backend build");

console.log("\n=== Building frontend ===");
run("pnpm --filter frontend build");

console.log("\n=== Copying static assets into standalone build ===");

const frontendRoot = path.join(projectRoot, "apps", "frontend");
const standaloneRuntime = path.join(
  frontendRoot,
  ".next",
  "standalone",
  "apps",
  "frontend",
);

if (!fs.existsSync(path.join(standaloneRuntime, "server.js"))) {
  console.error(`Standalone server.js not found at: ${standaloneRuntime}`);
  process.exit(1);
}

copy(
  path.join(frontendRoot, ".next", "static"),
  path.join(standaloneRuntime, ".next", "static"),
);

const publicDir = path.join(frontendRoot, "public");
if (fs.existsSync(publicDir)) {
  copy(publicDir, path.join(standaloneRuntime, "public"));
}

console.log(
  "\n✔ Build complete. Ready to run: pnpm --filter @pharmacy/desktop start",
);
