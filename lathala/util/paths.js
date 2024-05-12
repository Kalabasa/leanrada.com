import path from "node:path";

export function getTopDir() {
  if (!getTopDir.cache) {
    getTopDir.cache = path.resolve(import.meta.dirname, "../..");
  }
  return getTopDir.cache;
}

export function getPath(...paths) {
  return path.resolve(getTopDir(), ...paths);
}

export function normalizeDirPath(dirPath) {
  return path.normalize(dirPath && dirPath + "/");
}
