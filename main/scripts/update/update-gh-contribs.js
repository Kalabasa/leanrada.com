#!/usr/bin/env node
const path = require("node:path");
const fs = require("node:fs/promises");
const fetch = require("node-fetch");
const cheerio = require('cheerio');

process.chdir(path.resolve(__dirname, "..", ".."));
const projectRoot = process.cwd();
console.log(projectRoot);

const siteSrc = path.resolve(projectRoot, "src", "site");
const contribsFile = path.resolve(siteSrc, "misc", "gh-contribs.json");

updateContribs(contribsFile);

async function getContribs() {
  console.log("Fetching GitHub contributions...");
  const res = await fetch("https://github.com/users/Kalabasa/contributions");
  const html = await res.text();

  const cutoff = getCutoff();

  let data = parseContribs(html);
  data = data
    .filter(({ date }) => date >= cutoff)
    .sort(({ date: date1 }, { date: date2 }) => date1.getTime() - date2.getTime())
    .reduce((acc, curr, i) => {
      if (i % 7 === 0) acc.push([]);
      acc[acc.length - 1].push(curr.level);
      return acc;
    }, []);

  return data;
}

function getCutoff() {
  // calculate start of week
  const thisWeekStart = new Date();
  thisWeekStart.setUTCHours(0, 0, 0, 0);
  thisWeekStart.setUTCDate(thisWeekStart.getUTCDate() - thisWeekStart.getUTCDay());

  // cut off from {weeks} weeks ago
  const weeks = 4;
  const cutoff = new Date(thisWeekStart);
  cutoff.setUTCDate(thisWeekStart.getUTCDate() - weeks * 7);
  return cutoff;
}

function parseContribs(html) {
  const ch = cheerio.load(html);
  const chTable = ch("table.ContributionCalendar-grid");
  if (!chTable.length) throw new Error("Can't find table.");
  const chDays = chTable.find("[data-date]");
  const data = chDays.map((_, el) => {
    const chDay = ch(el);
    const date = new Date(chDay.attr("data-date"));
    const level = parseInt(chDay.attr("data-level"), 10);
    return { date, level };
  }).get();
  return data;
}

async function updateContribs(outFile) {
  try {
    console.log("Updating GitHub contributions");
    const contribs = await getContribs();
    await fs.writeFile(outFile, JSON.stringify(contribs, undefined, " "));
    console.log("GitHub contributions written to file:", outFile);
  } catch (e) {
    console.log("Error updating contribs:", e);
  }
}
