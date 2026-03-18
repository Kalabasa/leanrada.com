#!/usr/bin/env node
import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";

const noteDir = import.meta.dirname;
const indexPath = path.join(noteDir, "index.html");
const prerenderedPath = path.join(noteDir, "prerendered.html");

const tags = ["nat-sort-demo", "nat-sort-scatter"];

main();

async function main() {
  const prerendered = cheerio.load(await fs.readFile(prerenderedPath));
  const indexHTML = await fs.readFile(indexPath, "utf-8");

  const prerenderedEls = {};
  for (const tag of tags) {
    prerenderedEls[tag] = prerendered(tag).toArray();
  }

  const counters = Object.fromEntries(tags.map(t => [t, 0]));

  const blockRe = new RegExp(`^([ \\t]*)<(${tags.join("|")})(\\s[^>]*)?>[\\s\\S]*?<\\/\\2>`, "gm");

  let result = indexHTML.replace(blockRe, (match, indent, tag, attrs) => {
    const i = counters[tag]++;
    const el = prerenderedEls[tag]?.[i];
    if (!el) return match;

    const innerHTML = prerendered(el).html();
    if (!innerHTML) return match;

    const minified = innerHTML
      .trim()
      .replace(/\s+/g, " ")
      .replace(/> </g, "><")
      .trim();

    return `${indent}<${tag}${attrs ?? ""}>\n${indent}  <!--prerender.js-->${minified}\n${indent}</${tag}>`;
  });

  await fs.writeFile(indexPath, result);
  console.log(`Injected prerendered content into ${indexPath}`);
}
