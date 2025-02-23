import glob from "glob";
import path from "node:path";

export function findComponentNames(siteDir) {
  const files = glob.sync(path.resolve(siteDir, "components", "*", "*.js"));
  return files
    .filter(
      (file) => path.basename(path.dirname(file)) === path.basename(file, ".js")
    )
    .map((file) => path.basename(file, ".js"));
}
