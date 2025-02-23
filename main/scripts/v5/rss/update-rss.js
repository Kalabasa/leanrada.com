import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import { tryWrite } from "../util/try-write.mjs";

export async function updateRSS({ rssFilePath, notes, dryRun }) {
  const resolvedPath = path.resolve(rssFilePath);
  const sourceRSS = await fs.readFile(resolvedPath);
  const rewrittenRSS = await rewriteRSS(sourceRSS, notes);
  await tryWrite({
    filePath: rssFilePath,
    origText: sourceRSS,
    text: rewrittenRSS,
    verb: "rewriting",
    dryRun,
  });
}

async function rewriteRSS(rss, notes) {
  const ch = cheerio.load(rss, { xml: true });
  return ch.xml();
}
