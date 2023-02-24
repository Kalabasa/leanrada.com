const glob = require("glob");
const chalk = require("chalk");
const path = require("node:path");
const fs = require("node:fs/promises");
const cheerio = require('cheerio');

process.chdir(path.resolve(__dirname, ".."));
console.log(process.cwd());

const siteSrc = path.resolve(__dirname, "..", "src", "site");
const blogDir = path.resolve(siteSrc, "blog");
const dryRun = process.argv.includes("--dry-run");

main();

async function main() {
  const subPages = glob.sync(path.resolve(blogDir, "*", "index.html"));

  const index = await Promise.all(subPages.map(async page => {
    const dir = path.dirname(page);
    const href = path.relative(siteSrc, dir);

    // Yep, scraping my own source code
    const code = await fs.readFile(page);
    const ch = cheerio.load(code, { xmlMode: true });

    const header = ch("blog-header");
    const info = ch("blog-post-info");

    const title = header.attr("title");
    const date = info.attr("date");
    return { href: `/${href}/`, title, date };
  }));

  console.log(index);
  if (!dryRun) {
    const outFile = path.resolve(blogDir, "index.generated.json");
    await fs.writeFile(outFile, JSON.stringify(index, undefined, " "));
  }
}
