#!/usr/bin/env node
const glob = require("glob");
const path = require("node:path");
const fs = require("node:fs/promises");
const cheerio = require('cheerio');

process.chdir(path.resolve(__dirname, "..", ".."));
const projectRoot = process.cwd();
console.log(projectRoot);

const siteSrc = path.resolve(projectRoot, "src", "site");
const blogDir = path.resolve(siteSrc, "notes");
const dryRun = process.argv.includes("--dry-run");

main();

async function main() {
  const subPages = glob.sync(path.resolve(blogDir, "*", "index.html"));

  const index = (await Promise.all(subPages.map(async page => {
    const dir = path.dirname(page);
    const href = path.relative(siteSrc, dir);

    // Underscore-prefixed directories are unpublished.
    if (path.basename(dir).startsWith("_")) return null;

    // HTML is the source of truth
    // todo: use microformat?
    const code = await fs.readFile(page);
    const ch = cheerio.load(code, { xmlMode: true });

    const header = ch("blog-header");
    const pageTitle = ch("page-title");
    const title = ch("title");
    const info = ch("blog-post-info");
    const tag = ch("tag");

    const titleText =
      pageTitle.attr("title")
      ?? header.attr("title")
      ?? title.text();

    const date = info.attr("date");
    if (!date) console.error("No date for page:", titleText);

    const tags = tag.map(function () { return ch(this).text() }).toArray();

    return { href: `/${href}/`, title: titleText, date, tags };
  }))).filter(it => it);

  console.log(index);
  if (!dryRun) {
    const outFile = path.resolve(blogDir, "index.generated.json");
    await fs.writeFile(outFile, JSON.stringify(index, undefined, " "));
  }
}
