const ChildProcess = require("node:child_process");

module.exports = {
  goTop() {
    const top = ChildProcess.execSync("git rev-parse --show-toplevel");
    process.chdir(top.toString().trim());
    console.log(">", process.cwd());
  }
}