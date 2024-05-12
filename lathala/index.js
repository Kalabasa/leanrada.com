#!/usr/bin/env node
import arg from "arg";
import { createRequire } from "node:module";
import path from "node:path";
import { deployProjectsToDir, deployProjectsToGithubPages } from "./deploy.js";
import { runDevServer } from "./dev.js";
import { getProjects } from "./util/get_projects.js";
import chalk from "chalk";
import { colorInfo } from "./util/colors.js";

const args = arg({
  "--port": Number,
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

  const wwwDir = path.resolve("www");
  const wwwStagingDir = `${wwwDir}/staging`;
  const wwwProdDir = `${wwwDir}/prod`;
  deployProjectsToGithubPages(targetProjectDirs, wwwProdDir, "master", "docs");
}
