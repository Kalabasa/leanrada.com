#!/usr/bin/env node
const glob = require("glob");
const path = require("node:path");
const fs = require("node:fs/promises");
const cheerio = require('cheerio');

process.chdir(path.resolve(__dirname, "..", ".."));
const projectRoot = process.cwd();
console.log(projectRoot);

const site = path.resolve(projectRoot, "site");
const notesDir = path.resolve(site, "notes");
const dryRun = process.argv.includes("--dry-run");

main();

async function main() {
  const subPages = glob.sync(path.resolve(notesDir, "*", "index.html"));

  const references = new Map();
  const backReferences = new Map();

  // build index from parsed pages
  const index = (await Promise.all(subPages.map(async page => {
    const dir = path.dirname(page);
    const href = '/' + path.relative(site, dir) + '/';

    // Underscore-prefixed directories are unpublished.
    const public = !path.basename(dir).startsWith("_");

    try {
      // HTML is the source of truth
      const code = await fs.readFile(page);
      const ch = cheerio.load(code);

      // const uMedia = hEntry.find(".u-media").first();
      // const pCategory = hEntry.find(".tag-row .p-category");
      // const eContent = hEntry.find(".e-content").first();

      const title = ch("title").text();
      if (!title) throw new Error("Missing title!");

      // const media = uMedia.attr("src") || uMedia.attr("data-src") || uMedia.children("source[src]").first().attr("src");

      const date = ch("blog-post-info time").attr("datetime");
      if (!date) console.error("No date for page:", title);

      console.log(date);
      return;

      const tags = pCategory.map(function () { return ch(this).text() }).toArray();

      const refdNotePaths = eContent.html().match(/(?<=\/)notes\/[\w\-]+\b/g) ?? [];
      for (const path of refdNotePaths) {
        const otherHref = `/${path}/`;

        if (href === otherHref) continue;

        multimapAdd(references, href, otherHref);
        multimapAdd(backReferences, otherHref, href);
      }

      return { href, title, media, date, public, tags, suggestions: [] };
    } catch (error) {
      console.error("Error while processing:", href);
      throw error;
    }
  }))).filter(it => it);

  console.log(index);

  // const staticIndex = require(path.resolve(notesDir, "index.static.json"));
  // const combinedIndex = index.concat(staticIndex);

  // // populate suggestions
  // const maxSuggestions = 4;
  // const maxSmartSuggestions = maxSuggestions - 1;
  // const suggestionsIndex = index.filter(item => item.public).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // for (let i = 0; i < suggestionsIndex.length; i++) {
  //   const item = suggestionsIndex[i];

  //   // suggest references
  //   const refs = [
  //     ...(references.get(item.href) ?? []),
  //     ...(backReferences.get(item.href) ?? []),
  //   ];

  //   item.suggestions = refs
  //     .filter(unique)
  //     .slice(0, maxSmartSuggestions);

  //   // suggest by tag
  //   if (item.suggestions < maxSmartSuggestions) {
  //     const cotagged = suggestionsIndex
  //       .filter(other => other !== item)
  //       .map(other => ({
  //         href: other.href,
  //         score: other.tags.reduce((score, otherTag) => item.tags.includes(otherTag) ? score + 1 : score, 0)
  //       }))
  //       .filter(other => other.score > 0)
  //       .sort((a, b) => b.score - a.score)
  //       .map(other => other.href);
  //     item.suggestions = item.suggestions
  //       .concat(cotagged)
  //       .filter(unique)
  //       .slice(0, maxSmartSuggestions);
  //   }

  //   // suggest notes in sequence
  //   for (
  //     let j = (i + 1) % suggestionsIndex.length;
  //     item.suggestions.length < maxSuggestions && j !== i;
  //     j = (j + 1) % suggestionsIndex.length
  //   ) {
  //     const other = suggestionsIndex[j];
  //     if (!item.suggestions.includes(other.href)) {
  //       item.suggestions.push(other.href);
  //     }
  //   }

  //   console.log(item.href, item.suggestions);
  // }

  // console.log(combinedIndex.length, combinedIndex.map(item => item.href).sort().join(", "));
  // if (!dryRun) {
  //   const outFile = path.resolve(notesDir, "index.generated.combined.json");
  //   await fs.writeFile(outFile, JSON.stringify(combinedIndex, undefined, " "));
  // }
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