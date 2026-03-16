import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import { tryWrite } from "../util/try-write.mjs";
import { renderItem } from "./render-item.js";
import { createSnapshotter } from "./snapshot-page.js";

const domain = "leanrada.com";
const channelTitle = "leanrada.com notes";

export async function updateRSS({ rssFilePath, notes, siteDir, dryRun }) {
  const resolvedPath = (await import("node:path")).resolve(rssFilePath);
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
  let added = false;

  const ch = cheerio.load(rss, { xml: true });

  let oldestTime = Infinity;
  ch("item > pubDate").each(function (_, el) {
    oldestTime = Math.min(oldestTime, Date.parse(ch(el).text()));
  });

  const notesToRender = [];
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
    notesToRender.push({ note, date });
  }

  if (notesToRender.length === 0) return ch.xml();

  const snapshotter = await createSnapshotter(siteDir);

  try {
    for (const { note, date } of notesToRender) {
      const mainHTML = await snapshotter.snapshotPage(note.href);

      const itemXML = renderItem({
        mainHTML,
        pageHref: note.href,
        title: note.title,
        date,
        domain,
      });

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
  } finally {
    await snapshotter.close();
  }

  // prune old items
  if (added) {
    ch("item").each((i, el) => {
      if (i >= 20) ch(el).remove();
    });
  }

  return ch.xml();
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

function normalizePath(url) {
  if (!url.pathname.endsWith("/")) {
    url.pathname += "/";
  }
}
