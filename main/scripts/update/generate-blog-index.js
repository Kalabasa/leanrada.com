#!/usr/bin/env node
const glob = require("glob");
const path = require("node:path");
const fs = require("node:fs/promises");
const cheerio = require('cheerio');
const childProcess = require("node:child_process");

process.chdir(path.resolve(__dirname, "..", ".."));
const projectRoot = process.cwd();
console.log(projectRoot);

const siteSrc = path.resolve(projectRoot, "src", "site");
const siteOut = process.env.DEPLOY_DIR ?? path.resolve(projectRoot, "out", "site");
const blogSrcDir = path.resolve(siteSrc, "notes");
const blogOutDir = path.resolve(siteOut, "notes");
const dryRun = process.argv.includes("--dry-run");
const noBuild = process.argv.includes("--no-build");

if (!noBuild) {
  childProcess.execSync(
    "npm run clean-lite",
    { stdio: 'inherit' }
  );
  childProcess.execSync(
    "npm run build-dev -p /notes/",
    { stdio: 'inherit' }
  );
}

main();

async function main() {
  const subPages = glob.sync(path.resolve(blogOutDir, "*", "index.html"));

  const references = new Map();
  const backReferences = new Map();

  // build index from parsed pages
  const index = (await Promise.all(subPages.map(async page => {
    const dir = path.dirname(page);
    const href = '/' + path.relative(siteOut, dir) + '/';

    // Underscore-prefixed directories are unpublished.
    const public = !path.basename(dir).startsWith("_");

    try {
      // HTML is the source of truth
      const code = await fs.readFile(page);
      const ch = cheerio.load(code, { xmlMode: true });

      // Use microformats
      const hEntry = ch(".h-entry").first();
      if (hEntry.length === 0) {
        console.log("Skipping:", href);
        return;
      }

      const pName = hEntry.find(".p-name").first();
      const uMedia = hEntry.find(".u-media").first();
      const dtPublished = hEntry.find(".dt-published").first();
      const pCategory = hEntry.find(".tag-row .p-category");
      const eContent = hEntry.find(".e-content").first();

      const title = pName.text();
      if (!title) throw new Error("Missing title!");

      const media = uMedia.attr("src") || uMedia.children("source[src]").first().attr("src");

      const date = dtPublished.text();
      if (!date) console.error("No date for page:", title);

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

  const staticIndex = require(path.resolve(blogOutDir, "index.static.json"));
  const combinedIndex = index.concat(staticIndex);

  // populate suggestions
  const maxSuggestions = 4;
  const maxSmartSuggestions = maxSuggestions - 1;
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
      .slice(0, maxSmartSuggestions);

    // suggest by tag
    if (item.suggestions < maxSmartSuggestions) {
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
        .slice(0, maxSmartSuggestions);
    }

    // suggest notes in sequence
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
    const outFile = path.resolve(blogSrcDir, "index.generated.combined.json");
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