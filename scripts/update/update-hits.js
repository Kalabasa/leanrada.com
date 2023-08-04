#!/usr/bin/env node
const path = require("node:path");
const fs = require("node:fs/promises");
const fetch = require("node-fetch");

process.chdir(path.resolve(__dirname, "..", ".."));
const projectRoot = process.cwd();
console.log(projectRoot);

const siteSrc = path.resolve(projectRoot, "src", "site");
const hitsFile = path.resolve(siteSrc, "misc", "hits.json");

updateHits(hitsFile);

async function getHits() {
  console.log("Fetching hits...");
  const res = await fetch("https://kalabasa.goatcounter.com/counter/TOTAL.json");
  const data = await res.json();
  console.log("Hits:", data.count);
  return parseInt(data.count.replaceAll(/\D/g, ""));
}

async function updateHits(outFile) {
  try {
    console.log("Updating hits");
    const hits = await getHits();
    await fs.writeFile(outFile, JSON.stringify({ hits }));
    console.log("Hits written to file:", outFile);
  } catch (e) {
    console.log("Error updating hits:", e);
  }
}
