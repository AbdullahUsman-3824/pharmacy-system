const path = require("node:path");
const postgres = require("../electron/postgres/manager.cjs");
const backend = require("../electron/backend/manager.cjs");
const frontend = require("../electron/frontend/manager.cjs");

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

    console.log("Starting backend...");
    await backend.start(mockApp, databaseUrl);

    console.log("Starting frontend...");
    await frontend.start(mockApp, `http://127.0.0.1:${backend.PORT}`);

    console.log(
      "Everything ready. Open http://127.0.0.1:3000 in your browser.",
    );
    console.log("Press Ctrl+C to stop.");
    process.stdin.resume();

    process.on("SIGINT", async () => {
      console.log("\nShutting down...");
      frontend.stop();
      backend.stop();
      await postgres.stop(mockApp);
      process.exit(0);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    frontend.stop();
    backend.stop();
    await postgres.stop(mockApp);
    process.exit(1);
  }
})();
