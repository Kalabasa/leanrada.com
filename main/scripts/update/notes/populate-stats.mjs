import { exec } from "node:child_process";
import {
  reactionTypes,
  eventName,
} from "../../../site/components/article-reactions/article-reactions.js";
import { promisify } from "node:util";
const execAsync = promisify(exec);

const UPDATE_INTERVAL = 4 * 24 * 60 * 60_000;

// don't smash the server
let pendingFetch = Promise.resolve();

export async function populateStats({ enable, notes, existingNotes }) {
  await Promise.all(
    notes
      .filter((note) => note.public)
      .map(async (note) => {
        const existingNote = existingNotes.find(
          (existingNote) => existingNote.href === note.href
        );

        if (
          !enable ||
          existingNote?.stats?._nextUpdate > Date.now()
        ) {
          note.stats = existingNote?.stats;
          return;
        }

        const stats = {};
        await Promise.all([
          (async () => {
            stats.views = await (pendingFetch = pendingFetch
              .then(() => delay(1000))
              .then(() => fetchHits(note.href)));
          })(),
          ...reactionTypes.map(async (type) => {
            const pagePath = eventName(note.href, type);
            stats[type] = await (pendingFetch = pendingFetch
              .then(() => delay(1000))
              .then(() => fetchHits(pagePath)));
          }),
        ]);

        note.stats = stats;
        note.stats._nextUpdate =
          Date.now() + Math.floor(UPDATE_INTERVAL * (1 + Math.random()));
      })
  );
  return notes;
}

async function fetchHits(pagePath) {
  try {
    const url = `https://kalabasa.goatcounter.com/counter/${pagePath}.json`;
    console.log(`curling ${url}...`);
    const { stdout } = await execAsync(`curl -s ${url}`, {
      encoding: "utf-8",
    });
    const data = JSON.parse(stdout);
    const count = parseInt(data.count.replace(/\D/g, ""), 10) || 0;
    return count;
  } catch (error) {
    console.error("Fetching reactions failed!");
    console.error(error);
    throw error;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
