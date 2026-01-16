import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import { rewrite } from "../rewrite/rewrite.mjs";

const wordsPerMinute = 140;

export async function rewriteReadMins({ dryRun = false, htmlFilePath }) {
  const ch = cheerio.load(await fs.readFile(htmlFilePath));

  const info = ch("blog-post-info");
  if (!info) throw new Error("No <blog-post-info>!");

  const content = ch("main");
  if (!content) throw new Error("No content!");

  const text = content.text();
  const wordCount = text.trim().split(/\s+/g).length;
  const minutes = wordCount / wordsPerMinute;

  const minRead = Math.max(1, Math.round(minutes));
  console.log(`${minRead} min read!`);

  let replaced = false;
  await rewrite({
    htmlFilePath,
    setup(rewriter) {
      rewriter.on("blog-post-info", {
        text(text) {
          const match = text.text.match(/(?<= )(\w+ )?min read/);
          if (match) {
            const newText =
              text.text.slice(0, match.index) +
              `${minRead} min read` +
              text.text.slice(match.index + match[0].length);
            text.replace(newText);
            replaced = true;
          }
        },
      });
    },
    dryRun,
  });

  if (!replaced) {
    console.error("'X min read' not found!");
  }
}
