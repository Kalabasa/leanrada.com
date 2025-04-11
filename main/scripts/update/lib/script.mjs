import path from "node:path";

export function getDirs() {
  const projectRoot = path.resolve(import.meta.dirname, "..", "..", "..");
  if (path.basename(projectRoot) !== "main") {
    throw new Error("Unexpected project root!");
  }
  const siteDir = path.resolve(projectRoot, "site");

  return {
    projectRoot,
    siteDir,
  };
}

export function initScript() {
  const dirs = getDirs();
  process.chdir(dirs.projectRoot);
  return dirs;
}
