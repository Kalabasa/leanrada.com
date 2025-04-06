import { chdir, exit } from "node:process";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
chdir(dirname(new URL(import.meta.url).pathname));
const result = spawnSync(
  "npm",
  ["run", "wdio", "--", ...process.argv.slice("node test".split(" ").length)],
  { stdio: "inherit" }
);
exit(result.status);
