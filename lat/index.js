#!/usr/bin/env node
import arg from "arg";
import {
  deployProjectsToCloudflarePages,
  deployProjectsToDir,
  deployProjectsToGithubPages,
} from "./deploy.js";
import { runDevServer } from "./dev.js";
import { colorInfo } from "./util/colors.js";
import { getProjects } from "./util/get_projects.js";
import { getPath, getTopDir } from "./util/paths.js";
import { updateWorktree } from "./git.js";

const ALL = "ALL";

const argsDef = {
  "--yes": Boolean,
  "--prod": Boolean,
  "--cf-prod": Boolean,
  "--preview": Boolean,
  "--cf-preview": Boolean,
  "--gh-prod": Boolean,
  "--staging": Boolean,
  "--port": Number,
  "--dry-run": Boolean,
};
const args = arg(argsDef);
const subcommandFunctions = [dev, deploy, worktree];
const subcommandFunction = subcommandFunctions.find(
  (func) => func.name === args._[0]
);

function exitHelp() {
  console.log(
    `${colorInfo("Usage:")} lat (${subcommandFunctions
      .map((func) => func.name)
      .join("|")}) [...options]
    #${colorInfo("Options:")} ${Object.keys(argsDef).join(" ")}
    `.replaceAll(/^\s+#/gm, '').trim()
  );
  process.exit(1);
  throw new Error();
}

if (!subcommandFunction) {
  exitHelp();
}

process.chdir(getTopDir());
const wwwDir = getPath("www");
subcommandFunction(...args._.slice(1));

function dev() {
  const port = Number.parseInt(args["--port"] ?? process.env.PORT ?? 8000);
  runDevServer(port);
}

function exitDeployHelp() {
  const projectNames = getProjects().map((project) => project.name);
  console.log(
    `${colorInfo("Usage:")} lat deploy (${ALL} | <project-name> ...)
    #${colorInfo("<project-name>:")}
    #  ${projectNames.join("\n  ")}
    `.replaceAll(/^\s+#/gm, '').trim()
  );
  process.exit(1);
}

function deploy(...targetProjectDirs) {
  const projects = getProjects().map(p => p.name);

  if (targetProjectDirs.includes(ALL)) {
    if (targetProjectDirs.length > 1) {
      exitDeployHelp();
    }
    targetProjectDirs = projects;
  }

  if (targetProjectDirs.length === 0) {
    exitDeployHelp();
  }

  if (args["--cf-prod"] || args["--prod"] || args["--cf-preview"] || args["--preview"]) {
    deployProjectsToCloudflarePages({
      targetProjectDirs,
      workingDir: getWorkingDir(),
      cfBranch: getTargetBranch(),
      dryRun: args["--dry-run"],
      noConfirm: args["--yes"],
    });
  } else if (args["--gh-prod"]) {
    deployProjectsToGithubPages({
      targetProjectDirs,
      workingDir: getWorkingDir(),
      branch: getTargetBranch(),
      ghPagesDir: "docs",
      dryRun: args["--dry-run"],
      noConfirm: args["--yes"],
    });
  } else {
    deployProjectsToDir({
      targetProjectDirs,
      deployDir: getWorkingDir(),
      dryRun: args["--dry-run"],
      noConfirm: args["--yes"],
    });
  }
}

function worktree() {
  const dir = getWorkingDir();
  updateWorktree({
    dir,
    branch: getTargetBranch(),
  });
  console.log(`${colorInfo(dir)}`);
}

function getWorkingDir() {
  if (args["--cf-prod"] || args["--prod"]) {
    return `${wwwDir}/cf-prod`;
  } else if (args["--cf-preview"] || args["--preview"]) {
    return `${wwwDir}/cf-preview`;
  } else if (args["--gh-prod"]) {
    return `${wwwDir}/gh-prod`;
  } else {
    return `${wwwDir}/staging`;
  }
}

function getTargetBranch() {
  if (args["--cf-prod"] || args["--prod"]) {
    return "cf-pages";
  } else if (args["--cf-preview"] || args["--preview"]) {
    return "cf-pages-preview";
  } else if (args["--gh-prod"]) {
    return "master";
  } else {
    exitHelp();
  }
}