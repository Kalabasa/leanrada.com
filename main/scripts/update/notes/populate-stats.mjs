import { exec } from "node:child_process";
import {
  reactionTypes,
  eventName,
} from "../../../site/components/article-reactions/article-reactions.js";
import { promisify } from "node:util";
const execAsync = promisify(exec);

const UPDATE_INTERVAL = 7 * 24 * 60 * 60_000;

// don't smash the server
let pendingFetch = Promise.resolve();

export async function populateStats({ notes, existingNotes }) {
  await Promise.all(
    notes
      .filter((note) => note.public)
      .map(async (note) => {
        const existingNote = existingNotes.find(
          (existingNote) => existingNote.href === note.href
        );

        if (
          existingNote?.stats &&
          existingNote.stats._lastUpdated + UPDATE_INTERVAL > Date.now()
        ) {
          note.stats = existingNote.stats;
          return;
        }

        const stats = {};
        await Promise.all([
          (async () => {
            stats.views = await (pendingFetch = pendingFetch.then(() =>
              fetchHits(note.href)
            ));
          })(),
          ...reactionTypes.map(async (type) => {
            const pagePath = eventName(note.href, type);
            stats[type] = await (pendingFetch = pendingFetch.then(() =>
              fetchHits(pagePath)
            ));
          }),
        ]);

        note.stats = stats;
        note.stats._lastUpdated = Date.now();
      })
  );
  return notes;
}

async function fetchHits(pagePath) {
  try {
    const url = `https://kalabasa.goatcounter.com/counter/${pagePath}.json`;
    console.log(`curling ${url}...`);
    const { stdout } = await execAsync(`curl -s ${url}`, {
      encoding: "ascii",
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
