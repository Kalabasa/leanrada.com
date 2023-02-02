const glob = require("glob");
const path = require("node:path");
const fs = require("node:fs");
const { argv } = require("node:process");
const exp = require("node:constants");

const redirects = [
  ["works/**", "archive/v3/works/**.html"],
  ["works/canvaphotoeditor.html", "archive/v3/works/canvaphotoeditor.html", "projects/canva-photo-editor/"],
  ["works/dimensions.html", "archive/v3/works/dimensions.html", "projects/dimensions/"],
  ["works/hypertangram.html", "archive/v3/works/hypertangram.html", "projects/hypertangram/"],
  ["works/wikawik.html", "archive/v3/works/wikawik.html", "projects/wikawik/"],
];

const siteSrc = path.resolve(__dirname, "src", "site");

main();

async function main() {
  let expandedRedirects = new Map();

  for (const [from, to, newHref] of redirects) {
    const toFiles = glob.sync(path.resolve(siteSrc, to), { nodir: true });
    for (const toFile of toFiles) {
      const toHref = path.relative(siteSrc, toFile);

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
        console.log("Generating redirect file", from, "pointing to", to, ...(newHref ? ["with new href", newHref] : []));
        let html;
        if (to.startsWith("archive/")) {
          html = `<html><page><archive-view src="/${to}" newhref="${newHref ? '/' + newHref : ''}" /></page></html>`;
        } else {
          html = `<redirect-page href="/${newHref ?? to}" />`;
        }
        const outPath = path.resolve(siteSrc, from);
        await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
        await fs.promises.writeFile(outPath, html);
      })
  );
}
