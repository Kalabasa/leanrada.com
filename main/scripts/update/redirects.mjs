#!/usr/bin/env node
import { globSync } from "node:fs";
import chalk from "chalk";
import path from "node:path";
import fs from "node:fs";
import { argv } from "node:process";
import { initScript } from "./lib/script.mjs";

const { siteDir } = initScript();

// [from, to?]
const redirects = [
  ["works", "wares/"],
  ["works/miniforts", "wares/miniforts/"],
  ["works/miniforts.html", "wares/miniforts/"],
];

const dryRun = argv.includes("--dry-run");

main();

async function main() {
  let expandedRedirects = new Map();

  for (const [from, to] of redirects) {
    const toFiles = globSync(path.resolve(siteDir, to));

    if (!toFiles.length) {
      throw new Error("No destination files found. from/to: " + from + " → " + to);
    }

    for (const toFile of toFiles) {
      const stats = fs.lstatSync(toFile);

      const isArchive = path.relative(siteDir, toFile).startsWith("archive/");
      const isToDir = stats.isDirectory && !toFile.endsWith(".html");
      const isToIndexFile = toFile.endsWith("/index.html");
      const isToHtmlFile = toFile.endsWith(".html");

      if (isToDir && !fs.existsSync(path.resolve(toFile, "index.html"))) {
        throw new Errow("Missing destination index.html. from/to: " + from + " → " + toFile);
      }

      const cleanPath =
        isToIndexFile
          ? toFile.substring(0, toFile.length - "index.html".length)
          : (isToHtmlFile && !isArchive)
            ? toFile.substring(0, toFile.length - ".html".length)
            : toFile;
      const trailingSlash = isToIndexFile || isToDir ? "/" : "";
      const toHref = path.relative(siteDir, cleanPath) + trailingSlash;

      let fromHref;
      const toPrefix = to.indexOf("*");
      const fromPrefix = from.indexOf("*");
      if (toPrefix >= 0 && fromPrefix >= 0) {
        fromHref = from.substring(0, fromPrefix) + toHref.substring(toPrefix);
      } else {
        fromHref = from;
      }

      expandedRedirects.set(fromHref, toHref);
    }
  }

  if (dryRun) {
    console.log(expandedRedirects);
  }

  await Promise.all(
    Array.from(expandedRedirects.entries())
      .map(async ([from, to]) => {
        console.log("Generating redirect for", chalk.yellow(from));
        console.log("            pointing to", chalk.cyan(to));

        const html = `<link rel="canonical" href="/${to}"><meta http-equiv="refresh" content="0; url=/${to}">`;

        const isFromHtmlFile = from.endsWith(".html");

        const outPath = path.resolve(siteDir, from, isFromHtmlFile ? "" : "index.html");
        const outDir = path.dirname(outPath);
        if (dryRun) {
          const cwd = process.cwd();
          console.log(chalk.dim(
            "  mkdir " + path.relative(cwd, outDir)
            + "\n  write " + path.relative(cwd, outPath)
            + "\n    " + html
          ));
        } else {
          await fs.promises.mkdir(outDir, { recursive: true });
          await fs.promises.writeFile(outPath, html);
        }
      })
  );

  if (dryRun) {
    console.log("Dry run done.");
  }
}
