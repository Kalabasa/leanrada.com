#!/usr/bin/env node
const path = require("node:path");
const fs = require("node:fs/promises");
const fetch = require("node-fetch");

process.chdir(path.resolve(__dirname, "..", ".."));
const projectRoot = process.cwd();
console.log(projectRoot);

const GUESTBOOK_API =
  process.env.GUESTBOOK_API ?? "https://guestbook.leanrada.com/api";

const siteSrc = path.resolve(projectRoot, "src", "site");
const cacheFile = path.resolve(siteSrc, "guestbook", "cache.json");

updateGuestbookCache(cacheFile);

async function updateGuestbookCache(outFile) {
  try {
    console.log("Updating guestbook cache");
    const cache = { pages: {} };
    for (let i = 0; i < 100; i++) {
      const page = await loadPage(i);
      cache.pages[i] = page;
      if (page.empty) break;
    }
    await fs.writeFile(outFile, JSON.stringify(cache));
    console.log("Guestbook cache written to file:", outFile);
  } catch (e) {
    console.log("Error updating guestbook cache:", e);
  }
}

async function loadPage(page) {
  console.log("Loading guestbook page", page);
  const response = await fetch(GUESTBOOK_API + "?page=" + page);
  if (!response.ok) throw new Error();
  const data = await response.json();
  if (!data || data.length === 0) return { empty: true };
  return { empty: false, data };
}
