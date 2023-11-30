#!/usr/bin/env node
const path = require("node:path");
const fs = require("node:fs/promises");
const cheerio = require("cheerio");
const RSS = require("rss");

process.chdir(path.resolve(__dirname, "..", ".."));
const projectRoot = process.cwd();
console.log(projectRoot);

const domain = "leanrada.com";

const siteSrc = path.resolve(projectRoot, "src", "site");
const outRoot = path.resolve(projectRoot, "out", "site");
const blogSrcDir = path.resolve(siteSrc, "notes");
const dryRun = process.argv.includes("--dry-run");

main();

async function main() {
  const generatedIndexFile = path.resolve(blogSrcDir, "index.generated.json");
  const staticIndexFile = path.resolve(blogSrcDir, "index.static.json");

  const generatedIndex = JSON.parse(await fs.readFile(generatedIndexFile));
  const staticIndex = JSON.parse(await fs.readFile(staticIndexFile));

  const index = generatedIndex.concat(staticIndex)
    .filter(item => item.public);
  index.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const feed = new RSS({
    title: `${domain} notes`,
    feed_url: `https://${domain}/rss.xml`,
    site_url: `https://${domain}`,
  });

  for (const item of index) {
    const pageFile = path.resolve(outRoot, "./" + item.href, "index.html");

    if (!(await fs.stat(pageFile).catch(e => null))) {
      console.error("Error: Missing ", pageFile);
      continue;
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

    // Remove extra meta elements
    chContent.find(".content-header, .blog-header, .blog-post-info, .tag-row").remove();

    // Replace interactives
    const chInteractives = chContent.find("[data-rss='interactive']");
    const hasInteractive = chInteractives.length > 0;
    chInteractives.each((i, el) => {
      const chEl = ch(el);
      const label = chEl.attr("aria-label") ?? "";
      chEl.replaceWith(`<pre>Interactive content: <a href="${url}">Visit the website to play with interactive content!</a>\nAlternative text: ${label}</pre>`);
    });

    // Remove empty elements
    chContent.find("p:not(:has(*))")
      .filter((i, el) => ch(el).text().trim().length === 0)
      .remove();

    // Flatten structures
    let loopFlatten = true;
    while (loopFlatten) {
      loopFlatten = false;

      chContent.contents().each((i, el) => {
        if (["div", "section"].includes(el.name)) {
          ch(el).replaceWith(el.children);
          loopFlatten = true;
        } else if (el.type === "comment") {
          ch(el).remove();
        }
      });
    }

    // Format for plaintext
    chContent.contents().each((i, el) => {
      if (el.type === "text" && el.data.trim() === "") {
        ch(el).remove();
      }
    });
    const newRoot = ch("<div></div>");
    chContent.contents().each((i, el) => {
      const isBlock = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "ol", "ul", "pre", "img", "video", "details"]
        .includes(el.name);
      if (isBlock) newRoot.append("\n");
      newRoot.append(el);
      if (isBlock) newRoot.append("\n");
    });
    chContent = newRoot;

    // Remove extra attributes
    chContent.find("*").each((i, el) => {
      ch(el)
        .removeAttr("class")
        .removeAttr("style");
    });

    if (hasInteractive) {
      chContent.prepend(`<p><em>For RSS readers: This article contains interactive content available on the <a href="${url}">original post on ${domain}</a>.</em></p>\n`);
    }

    // Update URLs
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

    const content = chContent.html();

    feed.item({
      title: item.title,
      description: content,
      url,
      date: new Date(item.date),
    });
  }

  let feedXML = feed.xml({ indent: true });

  const lastBuildDateStart = feedXML.indexOf("<lastBuildDate>");
  const lastBuildDateEnd = feedXML.indexOf("</lastBuildDate>", lastBuildDateStart);
  feedXML = feedXML.slice(0, lastBuildDateStart)
    + feedXML.slice(lastBuildDateEnd + "</lastBuildDate>".length);

  if (!dryRun) {
    const outFile = path.resolve(outRoot, "rss.xml");
    await fs.mkdir(outRoot, { recursive: true });
    await fs.writeFile(outFile, feedXML);
    console.log("Written", outFile);
  }
}

function makeURL(domain, page, href) {
  if (/^(.+):\/\//.test(href)) return href;
  const urlPath = path.resolve("/", page, href);
  return `https://${domain}${urlPath}?ref=rss`;
}