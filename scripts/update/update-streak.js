#!/usr/bin/env node
const path = require("node:path");
const fs = require("node:fs/promises");
const fetch = require("node-fetch");

process.chdir(path.resolve(__dirname, "..", ".."));
const projectRoot = process.cwd();
console.log(projectRoot);

const siteSrc = path.resolve(projectRoot, "src", "site");
const streakFile = path.resolve(siteSrc, "misc", "streak.json");

updateStreak(streakFile);

async function getStreak() {
  console.log("Fetching streak...");
  const res = await fetch(
    "https://www.duolingo.com/2017-06-30/users?username=Kalabasa_&fields=streak,streakData%7BcurrentStreak,previousStreak%7D%7D"
  );
  const data = await res.json();
  const userData = data.users[0];
  const streak = Math.max(
    userData?.streak ?? 0,
    userData?.streakData?.currentStreak?.length ?? 0,
    userData?.streakData?.previousStreak?.length ?? 0
  );
  console.log("Streak:", streak);
  return streak;
}

async function updateStreak(outFile) {
  const fh = await fs.open(outFile, "a+");
  try {
    let record = 0;
    try {
      const recordObject = JSON.parse((await fh.readFile())?.toString());
      record = recordObject.streak;
      console.log("Recorded streak:", record);
    } catch (e) {
      record = 0;
    }
    console.log("Updating streak");
    const streak = Math.max(record, await getStreak());
    await fh.truncate();
    await fh.writeFile(JSON.stringify({ streak }));
    console.log("Streak written to file:", outFile);
  } catch (e) {
    console.log("Error updating streak:", e);
  } finally {
    fh.close();
  }
}
