#!/usr/bin/env node
const path = require("node:path");
const fs = require("node:fs/promises");
const fetch = require("node-fetch");

const cacheTTL = 1000 * 60 * 60 * 24 * 30;

if (require.main === module) {
  process.chdir(path.resolve(__dirname, ".."));
  console.log(process.cwd());

  const siteSrc = path.resolve(__dirname, "..", "src", "site");
  const reputationFile = path.resolve(siteSrc, "misc", "reputation.json");

  updateReputation(reputationFile);
}

async function getReputation() {
  console.log("Fetching reputation...");
  const res = await fetch(
    "https://stackoverflow.com/users/flair/3144156.json"
  );
  const data = await res.json();
  console.log("Reputation:", data.reputation);
  return data.reputation;
}

async function updateReputation(outFile) {
  const updateTime = Date.now();

  try {
    if (fs.existsSync(outFile)) {
      const data = JSON.parse(fs.readFileSync(outFile));
      if (data.updateTime + cacheTTL > updateTime) return;
    }
  } catch (e) { }

  try {
    console.log("Updating reputation");
    const reputation = await getReputation();
    await fs.writeFile(outFile, JSON.stringify({ updateTime, reputation }));
    console.log("Reputation written to file:", outFile);
  } catch (e) {
    console.log("Error updating reputation:", e);
  }
}

module.exports = {
  updateReputation,
};