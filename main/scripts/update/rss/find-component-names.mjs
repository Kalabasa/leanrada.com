import { globSync } from "node:fs";
import path from "node:path";

export function findComponentNames(siteDir) {
  const files = globSync(path.resolve(siteDir, "components", "*", "*.js"));
  return files
    .filter(
      (file) => path.basename(path.dirname(file)) === path.basename(file, ".js")
    )
    .map((file) => path.basename(file, ".js"));
}
