const path = require("node:path");
const postgres = require("../electron/postgres/manager.cjs");
const backend = require("../electron/backend/manager.cjs");

const mockApp = {
  isPackaged: false,
  getPath: (name) => {
    if (name === "userData") {
      return path.join(__dirname, ".local-userdata");
    }
    throw new Error(`unhandled path "${name}"`);
  },
};

(async () => {
  try {
    console.log("Starting Postgres...");
    await postgres.start(mockApp);

    const databaseUrl = await postgres.getDatabaseUrl(mockApp);
    console.log("Postgres ready:", databaseUrl);

    console.log("Starting backend...");
    await backend.start(mockApp, databaseUrl);

    console.log("Everything ready. Press Ctrl+C to stop.");
    process.stdin.resume();

    process.on("SIGINT", async () => {
      console.log("\nShutting down...");
      backend.stop();
      await postgres.stop(mockApp);
      process.exit(0);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    backend.stop();
    await postgres.stop(mockApp);
    process.exit(1);
  }
})();
