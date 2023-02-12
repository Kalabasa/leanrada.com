const glob = require("glob");
const path = require("node:path");
const fs = require("node:fs");
const { argv } = require("node:process");

const redirects = [
  ["works.html", "archive/v3/works.html", "projects/"],
  ["works/**", "archive/v3/works/**.html"],
  ["works/canvaphotoeditor.html", "projects/canva-photo-editor/"],
  ["works/dimensions.html", "projects/dimensions/"],
  ["works/hypertangram.html", "projects/hypertangram/"],
  ["works/wikawik.html", "projects/wikawik/"],
  ["works/sheetz.html", "projects/svelte-spreadsheet/"],
  ["works/dynastymap.html", "projects/dynaviz/"],
  ["works/freeformgesturedetector.html", "projects/freeform-gesture-detector/"],
  ["works/planetdefense.html", "projects/planet-defense/"],
  ["works/canvapasko.html", "projects/canva-pasko/"],
  ["works/miniforts.html", "projects/miniforts/"],
];

const siteSrc = path.resolve(__dirname, "src", "site");

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

      if (!toFile.endsWith(".html")) {
        if (stats.isDirectory && !fs.existsSync(path.resolve(toFile, "index.html"))) {
          throw new Error("Missing destination index.html. from/to: " + from + " → " + to);
        }
      }

      const toHref = path.relative(siteSrc, toFile) + (stats.isDirectory && !toFile.endsWith(".html") ? '/' : '');

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

  if (argv.includes("--dry-run")) {
    console.log(expandedRedirects);
    return;
  }

  await Promise.all(
    Array.from(expandedRedirects.entries())
      .map(async ([from, [to, newHref]]) => {
        console.log("Generating redirect for", from, "pointing to", to, ...(newHref ? ["with new href", newHref] : []));

        let html;
        if (to.startsWith("archive/")) {
          html = `<html><page noheader="true" nofooter="true"><archive-view src="/${to}" newhref="${newHref ? '/' + newHref : ''}" /></page></html>`;
        } else {
          html = `<html><redirect-page href="/${newHref ?? to}" /></html>`;
        }

        const outPath = path.resolve(siteSrc, from + "/index.html");
        const outDir = path.dirname(outPath);
        await fs.promises.mkdir(outDir, { recursive: true });
        await Promise.all([
          fs.promises.writeFile(path.resolve(outDir, ".generated"), ""),
          fs.promises.writeFile(outPath, html)
        ]);
      })
  );
}
