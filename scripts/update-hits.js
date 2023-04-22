#!/usr/bin/env node
const path = require("node:path");
const fs = require("node:fs/promises");
const fetch = require("node-fetch");

const apiKey = process.env.GOATCOUNTER_API_KEY;

if (!apiKey) {
  throw new Error("Env var GOATCOUNTER_API_KEY missing!");
}

if (require.main === module) {
  process.chdir(path.resolve(__dirname, ".."));
  console.log(process.cwd());

  const siteSrc = path.resolve(__dirname, "..", "src", "site");
  const hitsFile = path.resolve(siteSrc, "misc", "hits.json");

  updateHits(hitsFile);
}

async function getHits() {
  console.log("Fetching hits...");
  const res = await fetch(
    "https://kalabasa.goatcounter.com/api/v0/stats/total?start=1970-01-01T00:00:00.000Z",
    {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    }
  );
  const data = await res.json();
  console.log("Hits:", data.total);
  return data.total;
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

module.exports = {
  updateHits,
};