#!/usr/bin/env node
import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import { rewrite } from "./rewrite/rewrite.mjs";

process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const projectRoot = process.cwd();
console.log("Project root:", projectRoot);
if (path.basename(projectRoot) !== "main") {
  throw new Error("Unexpected project root!");
}

const dryRun = process.argv.includes("--dry-run");
const notePath = process.argv[process.argv.length - 1];

const wordsPerMinute = 140;

main();

async function main() {
  const htmlFilePath = path.join(notePath, "index.html");
  console.log("Reading", htmlFilePath);
  const ch = cheerio.load(await fs.readFile(htmlFilePath));

  const info = ch("blog-post-info");
  if (!info) throw new Error("No <blog-post-info>!");

  const content = ch("main.prose");
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
