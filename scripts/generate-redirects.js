#!/usr/bin/env node
const glob = require("glob");
const chalk = require("chalk");
const path = require("node:path");
const fs = require("node:fs");
const { argv } = require("node:process");

process.chdir(path.resolve(__dirname, ".."));
console.log(process.cwd());

// [from, to, newHref?]
const redirects = [
  ["works.html", "archive/v3/works.html", "wares/"],
  ["works/**", "archive/v3/works/**.html"],
  ["works/canvaphotoeditor.html", "wares/photo-editor/"],
  ["works/dimensions.html", "wares/dimensions/"],
  ["works/dimensions1.html", "wares/dimensions/part-one-generative-art.html"],
  ["works/dimensions2.html", "wares/dimensions/part-two-augmented-reality.html"],
  ["works/hypertangram.html", "wares/hypertangram/"],
  ["works/wikawik.html", "wares/wikawik/"],
  ["works/sheetz.html", "wares/svelte-spreadsheet/"],
  ["works/dynastymap.html", "wares/dynaviz/"],
  ["works/freeformgesturedetector.html", "wares/freeform-gesture-detector/"],
  ["works/planetdefense.html", "wares/planet-defense/"],
  ["works/canvapasko.html", "wares/canva-pasko/"],
  ["works/miniforts.html", "wares/miniforts/"], // inbound link, external referrer, don't delete
  ["works/canvaenterprise.html", "wares/canva-enterprise/"],
  ["works/canvalogomaker.html", "wares/canva-logo-maker/"],
  ["projects/canvaphotoeditor/", "wares/photo-editor/"],
  ["projects/dimensions/", "wares/dimensions/"],
  ["projects/hypertangram/", "wares/hypertangram/"],
  ["projects/wikawik/", "wares/wikawik/"],
  ["projects/sheetz/", "wares/svelte-spreadsheet/"],
  ["projects/dynastymap/", "wares/dynaviz/"],
  ["projects/freeformgesturedetector/", "wares/freeform-gesture-detector/"],
  ["projects/planetdefense/", "wares/planet-defense/"],
  ["projects/canvapasko/", "wares/canva-pasko/"],
  ["projects/miniforts/", "wares/miniforts/"],
  ["projects/canvaenterprise/", "wares/canva-enterprise/"],
  ["projects/canvalogomaker/", "wares/canva-logo-maker/"],
  ["projects", "wares/"],
  ["wares/canva-photo-editor", "wares/photo-editor"],
];

const siteSrc = path.resolve(__dirname, "..", "src", "site");
const dryRun = argv.includes("--dry-run");

main();

async function main() {
  let expandedRedirects = new Map();

  for (const [from, to, newHref] of redirects) {
    const toFiles = glob.sync(path.resolve(siteSrc, to));

    if (!toFiles.length) {
      throw new Error("No destination files found. from/to: " + from + " → " + to);
    }

    for (const toFile of toFiles) {
      const stats = fs.lstatSync(toFile);

      const isArchive = path.relative(siteSrc, toFile).startsWith("archive/");
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
      const toHref = path.relative(siteSrc, cleanPath) + trailingSlash;

      let fromHref;
      const toPrefix = to.indexOf("*");
      const fromPrefix = from.indexOf("*");
      if (toPrefix >= 0 && fromPrefix >= 0) {
        fromHref = from.substring(0, fromPrefix) + toHref.substring(toPrefix);
      } else {
        fromHref = from;
      }

      expandedRedirects.set(fromHref, [toHref, newHref]);
    }
  }

  if (dryRun) {
    console.log(expandedRedirects);
  }

  await Promise.all(
    Array.from(expandedRedirects.entries())
      .map(async ([from, [to, newHref]]) => {
        console.log("Generating redirect for", chalk.yellow(from));
        console.log("            pointing to", chalk.cyan(to));
        if (newHref) {
          console.log("          with new href", chalk.green(newHref));
        }

        let html;
        if (to.startsWith("archive/")) {
          html = `<html><page noheader="true" nofooter="true"><archive-view src="/${to}" newhref="${newHref ? "/" + newHref : ""}" /></page></html>`;
        } else {
          html = `<html><redirect-page href="/${newHref ?? to}" /></html>`;
        }

        const isFromIndexFile = from.endsWith("/index.html");

        const outPath = path.resolve(siteSrc, from, isFromIndexFile ? "" : "index.html");
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
          await Promise.all([
            fs.promises.writeFile(path.resolve(outDir, ".generated"), ""),
            fs.promises.writeFile(outPath, html)
          ]);
        }
      })
  );

  if (dryRun) {
    console.log("Dry run done.");
  }
}
