import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import { tryWrite } from "../util/try-write.mjs";
import { findComponentNames } from "./find-component-names.mjs";

const domain = "leanrada.com";
const channelTitle = "leanrada.com notes";

export async function updateRSS({ rssFilePath, notes, siteDir, dryRun }) {
  const resolvedPath = path.resolve(rssFilePath);
  const sourceRSS = (await fs.readFile(resolvedPath)) ?? renderBase();
  const rewrittenRSS = await rewriteRSS({ rss: sourceRSS, notes, siteDir });
  await tryWrite({
    filePath: rssFilePath,
    origText: sourceRSS,
    text: rewrittenRSS,
    verb: "rewriting",
    dryRun,
  });
}

async function rewriteRSS({ rss, notes, siteDir }) {
  const componentNames = findComponentNames(siteDir);

  let added = false;

  const ch = cheerio.load(rss, { xml: true });

  let oldestTime = Infinity;
  ch("item > pubDate").each(function (_, el) {
    oldestTime = Math.min(oldestTime, Date.parse(ch(el).text()));
  });

  for (const note of notes) {
    if (!note.public) continue;
    if (!note.href.startsWith("/")) {
      throw new Error("Sanity check failed!");
    }

    const date = new Date(note.date);
    if (date < oldestTime) continue;

    const url = new URL(note.href, `https://${domain}`);
    url.searchParams.set("ref", "rss");

    const matchEntry = ch("item > link").filter(function () {
      const itemURL = new URL(ch(this).text().trim());
      normalizePath(itemURL);
      return itemURL.href === url.href;
    });

    if (matchEntry.length > 0) continue;

    const itemXML = await renderItem({ note, url, componentNames, siteDir });

    // Find a place to insert the new item
    const deltas = ch("item")
      .toArray()
      .map((el) => {
        const cel = ch(el);
        const otherTime = Date.parse(cel.find("pubDate").text());
        const delta = date.getTime() - otherTime;
        return { el, delta };
      })
      .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));

    if (deltas.length === 0) {
      ch("channel").append(itemXML);
    } else {
      const nearest = deltas[0];
      if (nearest.delta > 0) {
        ch(nearest.el).before(itemXML.trimStart());
      } else {
        ch(nearest.el).after(itemXML.trimEnd());
      }
    }
    added = true;
  }

  // prune old items
  if (added) {
    // assuming items are sorted by descending date
    ch("item").each((i, el) => {
      if (i >= 20) ch(el).remove();
    });
  }

  return ch.xml();
}

async function renderItem({ note, url, componentNames, siteDir }) {
  const ch = cheerio.load(
    await fs.readFile(
      path.resolve(siteDir, path.relative("/", note.href), "index.html")
    )
  );

  const scripts = ch("script[src]");
  const pageScripts = scripts
    .toArray()
    .map((script) => {
      const name = path.basename(script.attribs.src, ".js");
      if (name === "common") return null;
      return name;
    })
    .filter((name) => name);
  const interactiveTags = pageScripts
    .concat(componentNames)
    .filter((tag) => !tag.includes("code-block"));

  let content = ch("main.prose");
  if (!content) {
    console.error("No content for page:", title);
    throw new Error("No content!");
  }

  // Remove extra elements
  content.find("style").remove();

  // Flatten structures
  let loopFlatten = true;
  while (loopFlatten) {
    loopFlatten = false;
    content.contents().each((i, el) => {
      if (["div", "span", "code-block"].includes(el.name)) {
        ch(el).replaceWith(el.children);
        loopFlatten = true;
      } else if (el.type === "comment") {
        ch(el).remove();
      }
    });
  }

  // Remove extra attributes
  content.find("*").each((i, el) => {
    ch(el).removeAttr("class").removeAttr("style");
  });

  // Replace interactive components
  const interactiveElements = content.find(interactiveTags.join(","));
  if (interactiveElements.length > 0) {
    content.prepend(
      `<p><em>For RSS readers: This article contains interactive content available on the <a href="${url.href}">original post on ${domain}</a>.</em></p>\n`
    );
  }
  interactiveElements.each((i, el) => {
    const cel = ch(el);
    const name = el.name
      .split("-")
      .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
      .join(" ");
    // TOOD: label generator imported from corresponding script module
    const label = cel.attr("alt") ?? cel.attr("aria-label") ?? "";
    cel.replaceWith(
      `<pre>Interactive content: <a href="${url.href}">Visit the website to play with interactive content!</a>` +
        `\nAlternative name: ${name}` +
        (label ? `\nAlternative text: ${label}` : "") +
        `</pre>`
    );
  });

  // Update URLs
  content.find("img,video,source").each((i, el) => {
    const cel = ch(el);
    const src = cel.attr("src");
    if (src) {
      cel.attr("src", makeURL(note.href, src));
    }
  });
  content.find("[href]").each((i, el) => {
    const cel = ch(el);
    const href = cel.attr("href");
    if (href) {
      cel.attr("href", makeURL(note.href, href));
    }
  });

  // Format for plaintext
  const tempRoot = ch("<div></div>");
  content.contents().each((i, el) => {
    if (el.type === "text" && el.data.trim() === "") {
      return;
    }

    const isBlock = [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ol",
      "ul",
      "pre",
      "figure",
      "img",
      "video",
      "details",
    ].includes(el.name);
    if (isBlock) tempRoot.append("\n");
    tempRoot.append(el);
    if (isBlock) tempRoot.append("\n");
  });
  content = tempRoot;

  const description = content.html();

  return `

    <item>
      <title><![CDATA[${note.title}]]></title>
      <link><![CDATA[${url}]]></link>
      <guid isPermaLink="true"><![CDATA[${url}]]></guid>
      <pubDate>${formatDate(new Date(note.date))}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>

    `;
}

function renderBase() {
  return `
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
  <channel>
      <title><![CDATA[${channelTitle}]]></title>
      <description><![CDATA[${channelTitle}]]></description>
      <link>${domain}</link>
      <atom:link href="${domain}/rss.xml" rel="self" type="application/rss+xml"/>
  </channel>
</rss>`;
}

function makeURL(pageHref, href) {
  if (/^(.+):\/\//.test(href)) return href;
  const urlPath = path.resolve("/", pageHref, href);
  const url = new URL(urlPath, `https://${domain}`);
  url.searchParams.set("ref", "rss");
  return url.href;
}

function formatDate(date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year} 00:00:00 GMT`;
}

function normalizePath(url) {
  if (!url.pathname.endsWith("/")) {
    url.pathname += "/";
  }
}
