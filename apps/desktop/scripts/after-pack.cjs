const fs = require("node:fs");
const path = require("node:path");

module.exports = async function (context) {
  const resourcesOutDir = path.join(context.appOutDir, "resources");
  const resourcesSrc = path.join(__dirname, "..", "resources");

  const folders = ["backend", "frontend", "postgres", "node"];

  for (const folder of folders) {
    const src = path.join(resourcesSrc, folder);
    const dest = path.join(resourcesOutDir, folder);

    console.log(`[afterPack] Copying ${folder}...`);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true });
  }

  console.log("[afterPack] All resources copied.");
};
