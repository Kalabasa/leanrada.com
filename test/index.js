import { chdir } from "node:process";
import { dirname } from "node:path";
import { execSync } from "node:child_process";
chdir(dirname(new URL(import.meta.url).pathname));
execSync("npm run wdio", { stdio: "inherit" });
