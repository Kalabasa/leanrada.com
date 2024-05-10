#!/usr/bin/env node
const glob = require("glob");
const chalk = require("chalk");
const path = require("node:path");
const fs = require("node:fs");
const { argv } = require("node:process");

process.chdir(path.resolve(__dirname, "..", ".."));
const projectRoot = process.cwd();
console.log(projectRoot);

const generatedDirContents = [
  ".generated",
  "index.html",
];

const siteSrc = path.resolve(projectRoot, "src", "site");
const dryRun = argv.includes("--dry-run");

main();

async function main() {
  const deleted = [];
  const generatedMarkers = glob.sync(path.resolve(siteSrc, "**/.generated"))
    .sort().reverse();

  if (dryRun) {
    console.log("generatedMarkers:", generatedMarkers);
  }

  for (const generatedMarker of generatedMarkers) {
    const dir = path.dirname(generatedMarker);

    const files = fs.readdirSync(dir)
      .filter(f => !deleted.includes(path.resolve(dir, f)));
    if (
      files.length !== generatedDirContents.length
      || !generatedDirContents.every(name => files.includes(name))
    ) {
      return;
    }

    if (dryRun) {
      const cwd = process.cwd();
      console.log("rm -r", path.relative(cwd, dir));
    } else {
      fs.rmSync(dir, { recursive: true });
      console.log("Removed", chalk.red(dir));
    }
    deleted.push(dir);
  }

  if (dryRun) {
    console.log("Dry run done.");
  }
}
