#!/usr/bin/env node
import glob from "glob";
import path from "node:path";
import fs from "node:fs/promises";
import * as cheerio from "cheerio";
import { populateSuggestions } from "./notes-index/populate-suggestions.mjs";
import { updateNotesIndexHTML } from "./notes-index/update-notes-index-html.mjs";
import { updateIndexHTMLNotes } from "./notes-index/update-index-html-notes.mjs";

process.chdir(path.resolve(import.meta.dirname, "..", ".."));
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
  const index = (
    await Promise.all(
      subPages.map(async (page) => {
        const dir = path.dirname(page);
        const href = "/" + path.relative(site, dir) + "/";

        // Underscore-prefixed directories are unpublished.
        const isPublic = !path.basename(dir).startsWith("_");

        try {
          // HTML is the source of truth
          const code = await fs.readFile(page);
          const ch = cheerio.load(code);

          const title = ch("title").text();
          if (!title) throw new Error("Missing title!");

          const media = ch("blog-header img, blog-header video").attr("src");

          const date = ch("blog-post-info time").attr("datetime");
          if (!date) {
            console.error("No date for page:", title);
            throw new Error();
          }

          const tags = ch("tag-row tag-chip")
            .map(function () {
              return ch(this).attr("title");
            })
            .toArray();

          const content = ch("main.prose");
          if (!content) {
            console.error("No content for page:", title);
            throw new Error();
          }

          const refdNotePaths =
            content.html().match(/(?<=\/)notes\/[\w\-]+\b/g) ?? [];
          for (const path of refdNotePaths) {
            const otherHref = `/${path}/`;

            if (href === otherHref) continue;

            multimapAdd(references, href, otherHref);
            multimapAdd(backReferences, otherHref, href);
          }

          return {
            href,
            title,
            media,
            date,
            public: isPublic,
            tags,
            suggestions: [],
          };
        } catch (error) {
          console.error("Error while processing:", href);
          throw error;
        }
      })
    )
  ).filter((it) => it);

  const staticIndex = JSON.parse(
    await fs.readFile(path.resolve(notesDir, "index.static.json"))
  );
  const combinedIndex = index.concat(staticIndex);

  // populate suggestions
  const maxSuggestions = 4;
  const maxSmartSuggestions = maxSuggestions - 1;
  const suggestionsIndex = index
    .filter((item) => item.public)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  populateSuggestions(
    suggestionsIndex,
    references,
    backReferences,
    maxSmartSuggestions,
    maxSuggestions
  );

  console.log(combinedIndex.length, "total notes indexed");

  const notesIndexHTMLPath = path.resolve(notesDir, "index.html");
  const notesIndexHTML = await fs.readFile(notesIndexHTMLPath);
  const updatedNotesIndexHTML = await updateNotesIndexHTML(
    combinedIndex,
    notesIndexHTML
  );
  if (!dryRun) {
    console.log("Rewriting", path.relative(process.cwd(), notesIndexHTMLPath));
    await fs.writeFile(notesIndexHTMLPath, updatedNotesIndexHTML);
  }

  const indexHTMLPath = path.resolve(site, "index.html");
  const indexHTML = await fs.readFile(indexHTMLPath);
  const updatedIndexHTML = await updateIndexHTMLNotes(combinedIndex, indexHTML);
  if (!dryRun) {
    console.log("Rewriting", path.relative(process.cwd(), indexHTMLPath));
    await fs.writeFile(indexHTMLPath, updatedIndexHTML);
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
