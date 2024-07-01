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

const args = arg({
  "--yes": Boolean,
  "--prod": Boolean,
  "--cf-prod": Boolean,
  "--gh-prod": Boolean,
  "--staging": Boolean,
  "--port": Number,
  "--dry-run": Boolean,
});
const subcommandFunctions = [dev, deploy];
const subcommandFunction = subcommandFunctions.find(
  (func) => func.name === args._[0]
);

if (!subcommandFunction) {
  console.log(
    `${colorInfo("Usage:")} lat (${subcommandFunctions
      .map((func) => func.name)
      .join("|")}) [...options]`
  );
  process.exit(1);
}

process.chdir(getTopDir());
subcommandFunction(args._.slice(1));

function dev() {
  const port = Number.parseInt(args["--port"] ?? process.env.PORT ?? 8000);
  runDevServer(port);
}

function deploy(targetProjectDirs) {
  if (!targetProjectDirs.length) {
    const suggestions = getProjects().map((project) => project.name);
    console.log(
      `${colorInfo("Usage:")} lat deploy (${suggestions.join("|")}) ...`
    );
    process.exit(1);
  }

  const wwwDir = getPath("www");
  if (args["--cf-prod"] || args["--prod"]) {
    const wwwProdDir = `${wwwDir}/cf-prod`;
    deployProjectsToCloudflarePages({
      targetProjectDirs,
      workingDir: wwwProdDir,
      cfBranch: "cf-pages",
      dryRun: args["--dry-run"],
      noConfirm: args["--yes"],
    });
  } else if (args["--gh-prod"]) {
    const wwwProdDir = `${wwwDir}/gh-prod`;
    deployProjectsToGithubPages({
      targetProjectDirs,
      workingDir: wwwProdDir,
      branch: "master",
      ghPagesDir: "docs",
      dryRun: args["--dry-run"],
      noConfirm: args["--yes"],
    });
  } else {
    const wwwStagingDir = `${wwwDir}/staging`;
    deployProjectsToDir({
      targetProjectDirs,
      deployDir: wwwStagingDir,
      dryRun: args["--dry-run"],
      noConfirm: args["--yes"],
    });
  }
}
