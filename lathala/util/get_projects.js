import { glob } from "glob";
import { createRequire } from "node:module";
import path from "node:path";
import { getPath, getTopDir, normalizeDirPath } from "./paths.js";
const require = createRequire(import.meta.url);

/**
 * @type {{
 *  webFilesDir: string,
 *  sitePathPrefix: string,
 *  rootDir: string,
 *  prepareCommand: string,
 * }} Project
 * @returns {Project[]}
 */
export function getProjects() {
  if (!getProjects.cache) {
    getProjects.cache = glob
      .sync(getPath("*/lathala.json"))
      .map((projectConfigPath) => {
        const config = require(projectConfigPath);
        return {
          ...config,
          webFilesDir: normalizeDirPath(config.webFilesDir),
          sitePathPrefix: normalizeDirPath(config.sitePathPrefix),
          rootDir: path.dirname(projectConfigPath),
          name: path.relative(getTopDir(), path.dirname(projectConfigPath)),
        };
      });
  }
  return getProjects.cache;
}
