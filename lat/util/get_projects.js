import { glob } from "glob";
import { createRequire } from "node:module";
import path from "node:path";
import { getPath, getTopDir, normalizeDirPath } from "./paths.js";
import { nonNull } from "./preconditions.js";
const require = createRequire(import.meta.url);

/**
 * @type {{
 *  name: string,
 *  rootDir: string,
 *  webFilesDir: string | undefined,
 *  devWebFilesDir: string  | undefined,
 *  excludePattern: string | undefined,
 *  sitePathPrefix: string,
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
        nonNull(config.devWebFilesDir ?? config.webFilesDir);
        return {
          ...config,
          devWebFilesDir:
            config.devWebFilesDir && normalizeDirPath(config.devWebFilesDir),
          webFilesDir:
            config.webFilesDir && normalizeDirPath(config.webFilesDir),
          sitePathPrefix: normalizeDirPath(nonNull(config.sitePathPrefix)),
          rootDir: path.dirname(projectConfigPath),
          name: path.relative(getTopDir(), path.dirname(projectConfigPath)),
        };
      });
  }
  return getProjects.cache;
}
