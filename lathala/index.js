#!/usr/bin/env node
import arg from "arg";
import { glob } from "glob";
import {
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  default as fs,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { cwd, exit, stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { goTop } from "../tools/top.js";
import { execSync } from "node:child_process";
const require = createRequire(import.meta.url);

goTop();

const args = arg({
  "--dry-run": Boolean,
});
const argDirs = args._;

// Read configs
const configs = glob
  .sync("*/lathala.json")
  .map((configPath) => ({
    ...require(path.resolve(configPath)),
    rootDir: path.dirname(configPath),
  }))
  .sort((a, b) => a.dstDir.length - b.dstDir.length);

const wwwDir = path.resolve("www");

// Pre-process commands
const commands = [];
let invalidState = false;
for (const argDir of argDirs) {
  const config = configs.find((config) => config.rootDir === argDir);
  if (!config) {
    console.error(`'${argDir}' not found!`);
    invalidState = true;
    continue;
  }

  const rootDir = path.resolve(config.rootDir);
  const srcDir = path.resolve(rootDir, config.srcDir);
  const dstDir = path.resolve(wwwDir, config.dstDir);
  const prepareScriptPath =
    config.prepare && path.resolve(rootDir, config.prepare);

  if (!existsSync(srcDir)) {
    console.error(`Missing srcDir: ${path.relative(cwd(), srcDir)}`);
    invalidState = true;
    continue;
  }

  if (prepareScriptPath) {
    const stat = statSync(prepareScriptPath);
    if (!stat.isFile || !(stat.mode & fs.constants.S_IXUSR)) {
      console.error(
        `Missing prepareScriptPath: ${path.relative(cwd(), prepareScriptPath)}`
      );
      invalidState = true;
      continue;
    }

    commands.push(`./${path.relative(".", prepareScriptPath)}`);
  }

  const excludes = configs
    .map((config) => config.dstDir)
    .filter(
      (otherDir) =>
        config.dstDir !== otherDir &&
        !path.relative(dstDir, path.resolve(wwwDir, otherDir)).startsWith("..")
    )
    .map((otherDir) => `--exclude '${otherDir}'`)
    .join(" ");
  commands.push(
    `rsync -Pr --del ` +
      (args["--dry-run"] ? " --dry-run" : "") +
      excludes +
      ` '${path.relative(".", srcDir)}/'` +
      ` '${path.relative(".", dstDir)}/'`
  );
}

if (invalidState || !commands.length) {
  exit(1);
}

// Confirm
console.log(`Preview: \n${commands.map((cmd) => "> " + cmd).join("\n")}`);
const rl = createInterface({ input: stdin, output: stdout });
const answer = await rl.question("Run commands? (y/n) ");
rl.close();
if (answer.toLowerCase() !== "y") exit(0);

// Setup working directory
try {
  mkdirSync(wwwDir, { recursive: true });

  // Run commands
  for (const command of commands) {
    execSync(command, { stdio: "inherit" });
  }
} finally {
  // Clean up
  // if (!args["--clean-"]) {
  //   rmSync(wwwDir, { recursive: true });
  // }
}
