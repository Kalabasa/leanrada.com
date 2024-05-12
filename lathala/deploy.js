import { getProjects } from "./util/get_projects.js";
import { getPath, getTopDir, normalizeDirPath } from "./util/paths.js";
import path from "node:path";
import fs from "node:fs";
import readline from "node:readline/promises";
import childProcess from "node:child_process";
import chalk from "chalk";
import {
  colorError,
  colorInfo,
  colorPrompt,
  colorQuote,
} from "./util/colors.js";

const rsyncArgs =
  " --checksum --del --progress --recursive" +
  " --exclude lathala.json" +
  " --dry-run";

export async function deployProjectsToDir(targetProjectDirs, deployDir) {
  const projects = getProjects();

  const targetProjects = projects.filter((project) =>
    targetProjectDirs.some((dir) => getPath(dir) === project.rootDir)
  );

  const commands = generateCommands(deployDir, projects, targetProjects);
  const script = commands.join(" &&\n ");
  console.log(
    [
      colorInfo("Build script preview:"),
      ...script.split("\n").map((line) => chalk.dim("> ") + colorQuote(line)),
    ].join("\n")
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const runCommandsAnswer = await rl.question(
    colorPrompt("Run build script? (y/N) ")
  );
  rl.close();

  if (runCommandsAnswer.toLowerCase() !== "y") process.exit(0);

  // Run deplyoment script
  try {
    fs.mkdirSync(deployDir, { recursive: true });
    exe(script);
  } catch (e) {
    if (e instanceof Error && e.pid) {
      process.exit(1);
    }
    throw e;
  }
}

function generateCommands(deployDir, allProjects, targetProjects) {
  const commands = [];
  let invalidState = false;

  const sortedTargetProjects = targetProjects.sort(
    (a, b) => a.sitePathPrefix.length - b.sitePathPrefix.length
  );

  for (const targetProject of sortedTargetProjects) {
    const rootDir = path.resolve(targetProject.rootDir);
    const webFilesDir = path.resolve(rootDir, targetProject.webFilesDir);
    const projectDeployDir = path.resolve(
      deployDir,
      targetProject.sitePathPrefix
    );

    if (!fs.existsSync(webFilesDir)) {
      console.error(
        colorError("Missing webFilesDir:") +
          " " +
          path.relative(cwd(), webFilesDir)
      );
      invalidState = true;
      continue;
    }

    commands.push(`cd ${rootDir}`);

    if (targetProject.prepareCommand) {
      commands.push(targetProject.prepareCommand);
    }

    const excludes = allProjects
      .filter(
        (otherProject) =>
          targetProject !== otherProject &&
          !path
            .relative(
              projectDeployDir,
              path.resolve(deployDir, otherProject.sitePathPrefix)
            )
            .startsWith("..")
      )
      .map((project) => ` --exclude '${project.sitePathPrefix}'`);

    commands.push(
      "rsync" +
        rsyncArgs +
        excludes +
        ` '${normalizeDirPath(path.relative(rootDir, webFilesDir))}'` +
        ` '${normalizeDirPath(path.relative(rootDir, projectDeployDir))}'`
    );
  }

  if (invalidState || !commands.length) {
    process.exit(1);
  }

  return commands;
}

export async function deployProjectsToGithubPages(
  targetProjectDirs,
  workingDir,
  branch,
  ghPagesDir
) {
  try {
    fs.rmSync(workingDir, { recursive: true, force: true });
    exe("git fetch");
    exe(
      `git worktree add -f ${path.relative(".", workingDir)} origin/${branch}`
    );

    fs.closeSync(fs.openSync(`${workingDir}/.nojekyll`, "a"));

    exe(`rsync ${rsyncArgs} '.github/' '${workingDir}/.github/'`);

    await deployProjectsToDir(
      targetProjectDirs,
      `${workingDir}/${ghPagesDir}/`
    );

    process.chdir(workingDir);
    exe(`git add .`);
    exe("git diff --cached HEAD");

    // Confirm change
    console.log(
      colorInfo("Updated files:") + " " + path.relative(getTopDir(), workingDir)
    );
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const deployWebsiteAnswer = await rl.question(
      colorPrompt("Commit changes? (y/N) ")
    );
    rl.close();

    if (deployWebsiteAnswer.toLowerCase() !== "y") process.exit(0);

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
      exe(`git commit -m 'Deploy ${targetProjectDirs.join(", ")}'`);
      exe(`git push origin HEAD:${branch}`);
    } else {
      console.log("No changes to deploy");
    }
  } finally {
    process.chdir(getTopDir());
    fs.rmSync(workingDir, { recursive: true });
    exe("git worktree prune");
  }
}

function exe(cmd) {
  return childProcess.execSync(cmd, {
    stdio: "inherit",
  });
}
