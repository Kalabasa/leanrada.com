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

  const references = new Map();
  const backReferences = new Map();

  // build index from parsed pages
  const index = (await Promise.all(subPages.map(async page => {
    const dir = path.dirname(page);
    const href = '/' + path.relative(siteSrc, dir) + '/';

    // Underscore-prefixed directories are unpublished.
    const public = !path.basename(dir).startsWith("_");

    // HTML is the source of truth
    // todo: use output HTML + microformat, to scrape the hero image
    const code = await fs.readFile(page);
    const ch = cheerio.load(code, { xmlMode: true });

    const header = ch("blog-header");
    const pageTitle = ch("page-title");
    const title = ch("title");
    const info = ch("blog-post-info");
    const tag = ch("tag-row").find("tag");
    const markdown = ch("markdown");

    const titleText =
      pageTitle.attr("title")
      ?? header.attr("title")
      ?? title.text();

    const date = info.attr("date");
    if (!date) console.error("No date for page:", titleText);

    const tags = tag.map(function () { return ch(this).text() }).toArray();

    const refdNotePaths = markdown.html().match(/(?<=\/)notes\/[\w\-]+\b/g) ?? [];
    for (const path of refdNotePaths) {
      const otherHref = `/${path}/`;

      if (href === otherHref) continue;

      multimapAdd(references, href, otherHref);
      multimapAdd(backReferences, otherHref, href);
    }

    return { href, title: titleText, date, public, tags, suggestions: [] };
  }))).filter(it => it);

  const staticIndex = require(path.resolve(blogDir, "index.static.json"));
  const combinedIndex = index.concat(staticIndex);

  // populate suggestions
  const maxSuggestions = 3;
  const suggestionsIndex = index.filter(item => item.public).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (let i = 0; i < suggestionsIndex.length; i++) {
    const item = suggestionsIndex[i];

    // suggest references
    const refs = [
      ...(references.get(item.href) ?? []),
      ...(backReferences.get(item.href) ?? []),
    ];

    item.suggestions = refs
      .filter(unique)
      .slice(0, maxSuggestions);

    // suggest by tag
    if (item.suggestions < maxSuggestions) {
      const cotagged = suggestionsIndex
        .filter(other => other !== item)
        .map(other => ({
          href: other.href,
          score: other.tags.reduce((score, otherTag) => item.tags.includes(otherTag) ? score + 1 : score, 0)
        }))
        .filter(other => other.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(other => other.href);
      item.suggestions = item.suggestions
        .concat(cotagged)
        .filter(unique)
        .slice(0, maxSuggestions);
    }

    // fallback: suggest notes in sequence
    for (
      let j = (i + 1) % suggestionsIndex.length;
      item.suggestions.length < maxSuggestions && j !== i;
      j = (j + 1) % suggestionsIndex.length
    ) {
      const other = suggestionsIndex[j];
      if (!item.suggestions.includes(other.href)) {
        item.suggestions.push(other.href);
      }
    }

    console.log(item.href, item.suggestions);
  }

  console.log(combinedIndex.length, combinedIndex.map(item => item.href).sort().join(", "));
  if (!dryRun) {
    const outFile = path.resolve(blogDir, "index.generated.combined.json");
    await fs.writeFile(outFile, JSON.stringify(combinedIndex, undefined, " "));
  }
}

function multimapAdd(map, key, value) {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  set.add(value);
}

function unique(value, index, array) {
  return array.indexOf(value) === index;
}