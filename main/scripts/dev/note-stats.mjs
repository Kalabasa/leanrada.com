#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const indexPath = path.resolve(
  __dirname,
  "..",
  "..",
  "site",
  "notes",
  "index.generated.combined.json"
);
const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
const validNotes = index.filter((note) => note.public && note.stats);
for (const note of validNotes) {
  note.stats.views ??= 0;
}

console.table(
  validNotes
    .toSorted((a, b) => {
      const ra =
        a.stats.bubble +
        a.stats.heart +
        a.stats.sun +
        a.stats.cloud +
        a.stats.fire;
      const rb =
        b.stats.bubble +
        b.stats.heart +
        b.stats.sun +
        b.stats.cloud +
        b.stats.fire;
      return rb - ra;
    })
    .slice(0, 10)
    .map((n) => {
      const s = n.stats;
      return {
        rankedByReactions: n.title,
        total: s.bubble + s.heart + s.sun + s.cloud + s.fire,
      };
    })
);

console.table(
  validNotes
    .toSorted((a, b) => {
      return b.stats.views - a.stats.views;
    })
    .slice(0, 10)
    .map((n) => {
      const s = n.stats;
      return {
        rankedByViews: n.title,
        views: s.views,
      };
    })
);

console.table(
  validNotes
    .filter((n) => n.stats.views >= 400)
    .toSorted((a, b) => {
      const ra =
        a.stats.bubble +
        a.stats.heart +
        a.stats.sun +
        a.stats.cloud +
        a.stats.fire;
      const rb =
        b.stats.bubble +
        b.stats.heart +
        b.stats.sun +
        b.stats.cloud +
        b.stats.fire;
      return rb / b.stats.views - ra / a.stats.views;
    })
    .slice(0, 10)
    .map((n) => {
      const s = n.stats;
      return {
        rankedByReactionRate: n.title,
        "rate%":
          Math.floor(
            ((s.bubble + s.heart + s.sun + s.cloud + s.fire) / s.views) * 100_00
          ) / 1_00,
      };
    })
);
