#!/usr/bin/env node
const path = require("node:path");
const fs = require("node:fs/promises");
const fetch = require("node-fetch");

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
  try {
    console.log("Updating reputation");
    const reputation = await getReputation();
    await fs.writeFile(outFile, JSON.stringify({ reputation }));
    console.log("Reputation written to file:", outFile);
  } catch (e) {
    console.log("Error updating reputation:", e);
  }
}

module.exports = {
  updateReputation,
};