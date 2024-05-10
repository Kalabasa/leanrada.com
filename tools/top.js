const { execSync } = require("node:child_process");
const path = require("node:path");

module.exports = {
  goTop() {
    const top = path.resolve(__dirname, "..");
    if (!top.endsWith("/kalabasa.github.io")) {
      throw new Error("Unexpected top directory!");
    }
    process.chdir(top.toString().trim());
    console.log(">", process.cwd());
  },
};
