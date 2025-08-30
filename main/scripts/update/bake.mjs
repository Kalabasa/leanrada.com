#!/usr/bin/env node
import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import { initScript } from "./lib/script.mjs";
import { rewriteLQIP } from "./lqip/lqip.mjs";
import { rewriteReadMins } from "./notes/read-mins.mjs";
import { rewrite } from "./rewrite/rewrite.mjs";

const { siteDir } = initScript();

const dryRun = process.argv.includes("--dry-run");
const htmlFilePath = path.resolve(process.argv[process.argv.length - 1]);

main();

async function main() {
  if (!path.resolve(htmlFilePath).startsWith(siteDir)) {
    throw new Error("File not part of site!");
  }

  console.group("🍞 Baking lqip");
  await rewriteLQIP({ dryRun, htmlFilePath });
  console.groupEnd();

  if (isNotePost(htmlFilePath)) {
    console.group("🍞 Baking read mins");
    await rewriteReadMins({ dryRun, htmlFilePath });
    console.groupEnd();
  }

  console.group("🍞 Baking canonical href");
  await rewriteCanonicalHref({ dryRun, htmlFilePath });
}

function isNotePost(htmlFilePath) {
  return getHref(htmlFilePath).startsWith("/notes/");
}

function getHref(htmlFilePath) {
  const rel = path.relative(siteDir, htmlFilePath);
  const pathname = rel.endsWith(".html")
    ? rel.endsWith("/index.html")
      ? rel.slice(0, -"index.html".length)
      : rel
    : rel + "/";
  return "/" + pathname;
}

export async function rewriteCanonicalHref({ dryRun = false, htmlFilePath }) {
  const ch = cheerio.load(await fs.readFile(htmlFilePath));
  const existingRelCanonical = ch("link[rel=canonical]");
  const href = getHref(htmlFilePath);

  if (path.basename(href).startsWith("_")) {
    console.warn(`❌ Current path is temporary: ${href}`);
    return;
  }

  await rewrite({
    htmlFilePath,
    setup(rewriter) {
      if (existingRelCanonical.length > 0) {
        rewriter.on("link[rel=canonical]", {
          element(element) {
            element.setAttribute("href", href);
          },
        });
      } else {
        let hasInserted = false;
        rewriter.on(":not(meta)", {
          element(element) {
            if (!hasInserted) {
              hasInserted = true;
              element.before(`<link rel="canonical" href="${href}">\n`, {
                html: true,
              });
            }
          },
        });
      }
    },
    dryRun,
  });
}
