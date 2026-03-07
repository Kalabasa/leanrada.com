import chalk from "chalk";
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { colorInfo, colorPrompt, colorQuote } from "./util/colors.js";
import { getProjects } from "./util/get_projects.js";
import { getPath, getTopDir, normalizeDirPath } from "./util/paths.js";
import { getGitExcludes, updateWorktree } from "./git.js";

export async function deployProjectsToDir({
  targetProjects,
  deployDir,
  dryRun = false,
  noConfirm = false,
}) {
  const commands = generateCommands({
    deployDir,
    targetProjects,
    dryRun,
  });
  const script = commands.join(" &&\n ");
  console.log(
    [
      colorInfo("Build script preview:"),
      ...script.split("\n").map((line) => chalk.dim("> ") + colorQuote(line)),
    ].join("\n")
  );

  if (!noConfirm && !(await confirmYN("Run build script?"))) {
    process.exit(0);
  }

  // Run deplyoment script
  try {
    for (const targetProject of targetProjects) {
      fs.mkdirSync(path.resolve(deployDir, targetProject.sitePathPrefix), {
        recursive: true,
      });
    }
    exe(script);
  } catch (e) {
    if (e instanceof Error && e.pid) {
      process.exit(1);
    }
    throw e;
  }
}

function generateCommands({
  deployDir,
  targetProjects,
  dryRun = false,
}) {
  const commands = [];
  let invalidState = false;

  const sortedTargetProjects = targetProjects.sort(
    (a, b) => a.sitePathPrefix.length - b.sitePathPrefix.length
  );

  for (const targetProject of sortedTargetProjects) {
    const rootDir = path.resolve(targetProject.rootDir);
    const webFilesDir =
      targetProject.webFilesDir &&
      path.resolve(rootDir, targetProject.webFilesDir);
    const projectDeployDir = path.resolve(
      deployDir,
      targetProject.sitePathPrefix
    );

    commands.push(`cd ${rootDir}`);

    if (targetProject.buildCommand) {
      const deployDir = normalizeDirPath(projectDeployDir);
      commands.push(
        targetProject.buildCommand.replaceAll("$deployDir", deployDir)
      );
    }

    const otherProjectPaths = getProjects()
      .filter(
        (otherProject) => targetProject !== otherProject &&
          !path
            .relative(
              projectDeployDir,
              path.resolve(deployDir, otherProject.sitePathPrefix)
            )
            .startsWith("..")
      )
      .map((project) => "/" + project.sitePathPrefix);

    const gitExcludes = getGitExcludes(webFilesDir);

    const excludeArgs = [
      ...otherProjectPaths,
      ...gitExcludes,
      ...(Array.isArray(targetProject.excludePattern)
        ? targetProject.excludePattern
        : [targetProject.excludePattern]),
    ]
      .filter((path) => path)
      .map((path) => ` --exclude '${path}'`)
      .join("");

    if (targetProject.webFilesDir) {
      commands.push(
        "rsync" +
          rsyncArgs({ dryRun }) +
          excludeArgs +
          ` '${normalizeDirPath(path.relative(rootDir, webFilesDir))}'` +
          ` '${normalizeDirPath(path.relative(rootDir, projectDeployDir))}'`
      );
    }
  }

  if (invalidState || !commands.length) {
    process.exit(1);
  }

  return commands;
}

export async function deployProjectsToGithubPages({
  targetProjects,
  workingDir,
  branch,
  ghPagesDir,
  dryRun = false,
  noConfirm = false,
}) {
  try {
    updateWorktree({ dir: workingDir, branch });

    fs.closeSync(fs.openSync(`${workingDir}/.nojekyll`, "a"));

    // todo: separate these files
    exe(`rsync ${rsyncArgs({ dryRun })} '.github/' '${workingDir}/.github/'`);

    await deployProjectsToDir({
      targetProjects,
      deployDir: `${workingDir}/${ghPagesDir}/`,
      dryRun,
      noConfirm,
    });

    process.chdir(workingDir);
    exe(`git add .`);

    let hasDiff = false;
    try {
      // exits with 1 if there were differences and 0 means no differences.
      exe("git diff-index --cached --quiet HEAD");
    } catch (e) {
      hasDiff = true;
      if (e.status !== 1) throw e;
    }

    if (!hasDiff) {
      console.log(colorInfo("No changes to deploy"));
      process.exit(0);
    }

    // Confirm change
    console.log(
      colorInfo("Updated files:") + " " + path.relative(getTopDir(), workingDir)
    );
    try {
      exe("git diff --cached HEAD");
    } catch (e) {}

    if (!noConfirm && !(await confirmYN(colorPrompt("Commit and push changes?")))) {
      process.exit(0);
    }

    exe("git config extensions.worktreeConfig true");
    exe("git config --worktree user.email 'Kalabasa@users.noreply.github.com'");
    exe("git config --worktree user.name 'Kalabasa'");
    exe(`git commit -m 'Deploy ${targetProjects.map(p => p.rootDir).join(", ")}'`);
    exe(`git push origin HEAD:${branch}`);
  } finally {
    process.chdir(getTopDir());
    exe("git worktree prune");
  }
}

export async function deployProjectsToCloudflarePages({
  targetProjects,
  workingDir,
  cfBranch,
  dryRun = false,
  noConfirm = false,
}) {
  try {
    updateWorktree({ dir: workingDir, branch: cfBranch });

    await deployProjectsToDir({
      targetProjects,
      deployDir: `${workingDir}/`,
      dryRun,
      noConfirm,
    });

    process.chdir(workingDir);
    exe(`git add .`);

    let hasDiff = false;
    try {
      // exits with 1 if there were differences and 0 means no differences.
      exe("git diff-index --cached --quiet HEAD");
    } catch (e) {
      hasDiff = true;
      if (e.status !== 1) throw e;
    }

    if (!hasDiff) {
      console.log(colorInfo("No changes to deploy"));
      process.exit(0);
    }

    // Confirm change
    console.log(
      colorInfo("Updated files:") + " " + path.relative(getTopDir(), workingDir)
    );
    try {
      exe("git diff --cached HEAD");
    } catch (e) {}

    if (!noConfirm && !(await confirmYN(colorPrompt("Commit and push changes?")))) {
      process.exit(0);
    }

    exe("git config extensions.worktreeConfig true");
    exe("git config --worktree user.email 'Kalabasa@users.noreply.github.com'");
    exe("git config --worktree user.name 'Kalabasa'");
    exe(`git commit -m 'Deploy ${targetProjects.map(p => p.rootDir).join(", ")}'`);
    exe(`git push origin HEAD:${cfBranch}`);

    // exe(
    //   `wrangler pages deploy --project-name leanrada-com --branch ${cfBranch} ${workingDir}`
    // );
  } finally {
    process.chdir(getTopDir());
    exe("git worktree prune");
  }
}

async function confirmYN(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(colorPrompt(prompt + " (y/N): "));
  rl.close();
  return answer.toLowerCase() === "y";
}

function rsyncArgs({ dryRun }) {
  return (
    " --checksum --del --progress --recursive" +
    " --exclude lathala.json" +
    " --exclude .git" +
    (dryRun ? " --dry-run" : "")
  );
}

function exe(cmd) {
  return childProcess.execSync(cmd, {
    stdio: "inherit",
  });
}
