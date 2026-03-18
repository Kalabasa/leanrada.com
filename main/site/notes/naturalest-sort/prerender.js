#!/usr/bin/env node
import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import { initScript } from "../../../scripts/update/lib/script.mjs";
import { createSnapshotter } from "../../../scripts/update/rss/snapshot-page.js";

const { siteDir } = initScript();

const noteDir = path.join(siteDir, "notes/naturalest-sort");
const indexPath = path.join(noteDir, "index.html");
const outputPath = path.join(noteDir, "prerendered.html");
const pageHref = "/notes/naturalest-sort/?prerender";

main();

async function main() {
  const snapshotter = await createSnapshotter(siteDir);
  try {
    const mainHTML = await snapshotter.snapshotPage(pageHref);
    const rendered = cheerio.load(`<main>${mainHTML}</main>`);
    const source = cheerio.load(await fs.readFile(indexPath));

    const componentTags = ["nat-sort-demo", "nat-sort-scatter"];

    for (const tag of componentTags) {
      const renderedEls = rendered(tag).toArray();
      const sourceEls = source(tag).toArray();

      for (let i = 0; i < sourceEls.length; i++) {
        const renderedEl = renderedEls[i];
        if (!renderedEl) continue;
        const innerHTML = rendered(renderedEl).html();
        if (innerHTML) {
          source(sourceEls[i]).html(innerHTML);
        }
      }
    }

    await fs.writeFile(outputPath, source.html());
    console.log(`Wrote ${outputPath}`);
  } finally {
    await snapshotter.close();
  }
}
