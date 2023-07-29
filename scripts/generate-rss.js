#!/usr/bin/env node
const glob = require("glob");
const path = require("node:path");
const fs = require("node:fs/promises");
const execSync = require("node:child_process").execSync;
const cheerio = require("cheerio");
const RSS = require("rss");

process.chdir(path.resolve(__dirname, ".."));
console.log(process.cwd());

const domain = "leanrada.com";

const siteSrc = path.resolve(__dirname, "..", "src", "site");
const outRoot = path.resolve(__dirname, "..", "out", "site");
const staticRoot = path.resolve(__dirname, "..", "prod-static", "docs");
const blogSrcDir = path.resolve(siteSrc, "notes");
const dryRun = process.argv.includes("--dry-run");

main();

async function main() {
  const generatedIndexFile = path.resolve(blogSrcDir, "index.generated.json");
  const staticIndexFile = path.resolve(blogSrcDir, "index.static.json");

  const generatedIndex = JSON.parse(await fs.readFile(generatedIndexFile));
  const staticIndex = JSON.parse(await fs.readFile(staticIndexFile));

  const index = generatedIndex.concat(staticIndex);
  index.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const feed = new RSS({
    title: `${domain} Notes`,
    feed_url: `https://${domain}/rss.xml`,
    site_url: `https://${domain}`,
  });

  for (const item of index) {
    const pageFile = path.resolve(outRoot, "./" + item.href, "index.html");

    if (!(await fs.stat(pageFile).catch(e => null))) {
      console.log("Missing ", pageFile);
      execSync(`npm run build-prod -- -p ${item.href}`, { stdio: "inherit" });
    }

    const url = makeURL(domain, item.href, ".");

    const page = await fs.readFile(pageFile);
    const ch = cheerio.load(page);

    let chContent = ch(".blog-page > .content");
    if (!chContent.length) chContent = ch(".page-wrapper-content");
    if (!chContent.length) {
      console.error("Error: No content found. Href:", item.href);
      continue;
    }

    chContent.find(".content-header, .blog-header, .blog-post-info, .tag-row").remove();
    chContent.find("[data-rss='interactive']").each((i, el) => {
      const chEl = ch(el);
      const altLine = chEl.attr("alt");
      chEl.replaceWith(`<pre>Interactive content: <a href="${url}">See it on ${domain}.</a>${altLine}</pre>`);
    });
    chContent.find("p:not(:has(*))")
      .filter((i, el) => ch(el).text().trim().length === 0)
      .remove();

    const newRoot = ch("<div></div>");
    chContent.find("p, img, video, pre").appendTo(newRoot);
    chContent = newRoot;

    chContent.find("img,video,source").each((i, el) => {
      const chEl = ch(el);
      const src = chEl.attr("src");
      if (src) {
        chEl.attr("src", makeURL(domain, item.href, src));
      }
    });
    chContent.find("[href]").each((i, el) => {
      const chEl = ch(el);
      const href = chEl.attr("href");
      if (href) {
        chEl.attr("href", makeURL(domain, item.href, href));
      }
    });

    chContent.find("*").each((i, el) => {
      ch(el).removeAttr("class").removeAttr("style");
    });

    const content = chContent.html();

    feed.item({
      title: item.title,
      description: content,
      url,
      date: new Date(item.date),
    });
  }

  const feedXML = feed.xml({ indent: true });

  if (!dryRun) {
    const outFile = path.resolve(staticRoot, "rss.xml");
    await fs.mkdir(staticRoot, { recursive: true });
    await fs.writeFile(outFile, feedXML);
    console.log("Written", outFile);
  }
}

function makeURL(domain, page, href) {
  if (/^(.+):\/\//.test(href)) return href;
  const urlPath = path.resolve("/", page, href);
  return `https://${domain}${urlPath}`;
}