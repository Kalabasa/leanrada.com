import path from "node:path";

export function getTopDir() {
  if (!getTopDir.cache) {
    getTopDir.cache = path.resolve(
      new URL(import.meta.url).pathname,
      "../../.."
    );
  }
  return getTopDir.cache;
}

export function getPath(...paths) {
  return path.resolve(getTopDir(), ...paths);
}

export function normalizeDirPath(dirPath) {
  return dirPath && (dirPath.length > 0 ? path.normalize(dirPath + "/") : "./");
}
