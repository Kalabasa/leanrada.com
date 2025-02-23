import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";

export async function updateRSS({ rssFilePath, notes, dryRun }) {
  const resolvedPath = path.resolve(rssFilePath);
  const sourceRSS = await fs.readFile(resolvedPath);
  const rewrittenRSS = await rewriteRSS(sourceRSS, notes);
  const relativePath = path.relative(process.cwd(), resolvedPath);
  if (dryRun) {
    console.log("Not rewriting:", relativePath);
  } else {
    console.log("Rewriting:", relativePath);
    await fs.writeFile(resolvedPath, rewrittenRSS);
  }
}

async function rewriteRSS(rss, notes) {
  const ch = cheerio.load(rss, { xml: true });
  return ch.xml();
}
