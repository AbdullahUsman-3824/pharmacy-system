const path = require("node:path");
const postgres = require("../electron/postgres/manager.cjs");

// Mock Electron's app object, sirf standalone testing ke liye
const mockApp = {
  isPackaged: false,
  getPath: (name) => {
    if (name === "userData") {
      return path.join(__dirname, ".local-userdata");
    }
    throw new Error(`mockApp.getPath: unhandled path "${name}"`);
  },
};

(async () => {
  try {
    await postgres.start(mockApp);

    const url = await postgres.getDatabaseUrl(mockApp);
    console.log("Connection URL:", url);

    console.log("Postgres is running. Press Ctrl+C to stop and exit.");
    process.stdin.resume();

    process.on("SIGINT", async () => {
      console.log("\nStopping Postgres...");
      await postgres.stop(mockApp);
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start Postgres:", error);
    process.exit(1);
  }
})();
