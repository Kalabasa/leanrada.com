import path from "node:path";

export function getTopDir() {
  if (!getTopDir.cache) {
    getTopDir.cache = path.resolve(
      new URL(import.meta.url).pathname,
      "../../.."
    );
  }
  if (path.basename(getTopDir.cache) !== "leanrada.com") {
    throw new Error("Wrong top directory!");
  }
  return getTopDir.cache;
}

export function getPath(...paths) {
  return path.resolve(getTopDir(), ...paths);
}

export function normalizeDirPath(dirPath) {
  return dirPath ? path.normalize(dirPath + "/") : "./";
}
