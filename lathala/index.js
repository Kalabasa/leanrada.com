#!/usr/bin/env node
import arg from "arg";
import { glob } from "glob";
import {
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  default as fs,
  openSync,
  closeSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { chdir, cwd, exit, stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { goTop } from "../tools/top.js";
import { execSync } from "node:child_process";
const require = createRequire(import.meta.url);

goTop();
console.log(">", process.cwd());

const args = arg({
  "--dry-run": Boolean,
  "--no-prepare": Boolean,
  "--no-deploy": Boolean,
});
const argDirs = args._;

const rsyncArgs =
  " --checksum --del --progress --recursive" +
  (args["--dry-run"] ? " --dry-run" : "");

function exe(cmd) {
  return execSync(cmd, {
    stdio: "inherit",
  });
}

// Read configs
const configs = glob
  .sync("*/lathala.json")
  .map((configPath) => ({
    ...require(path.resolve(configPath)),
    rootDir: path.dirname(configPath),
  }))
  .sort((a, b) => a.dstDir.length - b.dstDir.length);

const wwwDir = path.resolve("www");
const wwwStagingDir = `${wwwDir}/staging`;
const wwwProdDir = `${wwwDir}/prod`;

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
  const dstDir = path.resolve(wwwStagingDir, config.dstDir);
  const prepareScriptPath =
    config.prepare && path.resolve(rootDir, config.prepare);

  if (!existsSync(srcDir)) {
    console.error(`Missing srcDir: ${path.relative(cwd(), srcDir)}`);
    invalidState = true;
    continue;
  }

  if (!args["--no-prepare"] && prepareScriptPath) {
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
        !path
          .relative(dstDir, path.resolve(wwwStagingDir, otherDir))
          .startsWith("..")
    )
    .map((otherDir) => ` --exclude '${otherDir}'`);
  commands.push(
    "rsync" +
      rsyncArgs +
      excludes +
      ` '${path.relative(".", srcDir)}/'` +
      ` '${path.relative(".", dstDir)}/'`
  );
}

if (invalidState || !commands.length) {
  exit(1);
}

// Confirm run
console.log(`Preview: \n${commands.map((cmd) => "> " + cmd).join("\n")}`);
const rl = createInterface({ input: stdin, output: stdout });
const runCommandsAnswer = await rl.question("Run commands? (y/n) ");
rl.close();
if (runCommandsAnswer.toLowerCase() !== "y") exit(0);

// Setup working directory
try {
  mkdirSync(wwwDir, { recursive: true });
  mkdirSync(wwwStagingDir, { recursive: true });

  // Run commands
  for (const command of commands) {
    exe(command);
  }
} finally {
  // Clean up?
}

if (!args["--no-deploy"]) {
  // Confirm deploy
  console.log(
    `Website files in ${path.relative(".", wwwStagingDir)} up to date`
  );
  const rl = createInterface({ input: stdin, output: stdout });
  const deployWebsiteAnswer = await rl.question("Deploy website? (y/n) ");
  rl.close();
  if (deployWebsiteAnswer.toLowerCase() !== "y") exit(0);

  try {
    rmSync(wwwProdDir, { recursive: true, force: true });
    exe("git fetch");
    exe(`git worktree add -f ${path.relative(".", wwwProdDir)} origin/master`);

    closeSync(openSync(`${wwwProdDir}/.nojekyll`, "a"));

    exe(`rsync ${rsyncArgs} '.github/' '${wwwProdDir}/.github/'`);
    exe(`rsync ${rsyncArgs} '${wwwStagingDir}/' '${wwwProdDir}/docs/'`);

    chdir(wwwProdDir);
    exe(`git add .`);

    let hasDiff = false;
    try {
      // exits with 1 if there were differences and 0 means no differences.
      exe("git diff-index --cached --quiet HEAD");
    } catch (e) {
      hasDiff = true;
      if (e.status !== 1) throw e;
    }

    if (hasDiff) {
      exe("git config extensions.worktreeConfig true");
      exe(
        "git config --worktree user.email 'Kalabasa@users.noreply.github.com'"
      );
      exe("git config --worktree user.name 'Kalabasa'");
      exe(`git commit -m 'Deploy ${argDirs.join(", ")}'`);
      exe("git push origin HEAD:master");
    } else {
      console.log("No changes to deploy");
    }
  } finally {
    goTop();
    rmSync(wwwProdDir, { recursive: true });
    exe("git worktree prune");
  }
}
