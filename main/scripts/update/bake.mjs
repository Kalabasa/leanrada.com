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

  console.group("🍞 Baking canonical href");
  await rewriteElementAttributes({
    dryRun, htmlFilePath,
    afterTags: ["meta"],
    tagName: "link",
    identifierAttributes: { rel: "canonical" },
    valueAttributes: { href: getHref(htmlFilePath) },
  });
  console.groupEnd();

  if (isNotePost(htmlFilePath) || isRootPage(htmlFilePath)) {
    console.group("🍞 Baking webmention href");
    await rewriteElementAttributes({
      dryRun, htmlFilePath,
      afterTags: ["meta"],
      tagName: "link",
      identifierAttributes: { rel: "webmention" },
      valueAttributes: { href: "https://webmention.io/leanrada.com/webmention" },
    });
    console.groupEnd();
  }

  console.group("🍞 Baking lqip");
  await rewriteLQIP({ dryRun, htmlFilePath });
  console.groupEnd();

  if (isNotePost(htmlFilePath)) {
    console.group("🍞 Baking read mins");
    await rewriteReadMins({ dryRun, htmlFilePath });
    console.groupEnd();
  }
}

function isRootPage(htmlFilePath) {
  const href = getHref(htmlFilePath);
  return href === "/";
}

function isNotePost(htmlFilePath) {
  return getHref(htmlFilePath).startsWith("/notes/");
}

function getHref(htmlFilePath) {
  const rel = path.relative(siteDir, htmlFilePath);
  const pathname = rel.endsWith(".html")
    ? rel === "index.html" || rel.endsWith("/index.html")
      ? rel.slice(0, -"index.html".length)
      : rel
    : rel + "/";
  return "/" + pathname;
}

async function rewriteElementAttributes({ dryRun = false, htmlFilePath, tagName, afterTags, identifierAttributes, valueAttributes }) {
  const filtersSelector = Object.entries(identifierAttributes)
    .map(([k, v]) => `[${k}="${v}"]`)
    .join("");
  const selector = tagName + filtersSelector;

  const ch = cheerio.load(await fs.readFile(htmlFilePath));
  const exists = ch(selector).length > 0;

  await rewrite({
    htmlFilePath,
    setup(rewriter) {
      if (exists) {
        rewriter.on(selector, {
          element(element) {
            for (const [k, v] of Object.entries(valueAttributes)) {
              element.setAttribute(k, v);
            }
          },
        });
      } else {
        let hasInserted = false;
        rewriter.on(`:not(${afterTags.join(",")})`, {
          element(element) {
            if (!hasInserted) {
              hasInserted = true;
              let attributesHTML = "";
              for (const [k, v] of Object.entries(identifierAttributes)) {
                attributesHTML += " " + attributeHTML(k, v);
              }
              for (const [k, v] of Object.entries(valueAttributes)) {
                attributesHTML += " " + attributeHTML(k, v);
              }
              element.before(`<${tagName}${attributesHTML}>\n`, {
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

function attributeHTML(name, value) {
  return `${name}="${value.replaceAll(/["'&<>]/g, (ch) => {
    switch (ch.charCodeAt(0)) {
      case 34: // "
        return '&quot;'
      case 38: // &
        return '&amp;'
      case 39: // '
        return '&#39;'
      case 60: // <
        return '&lt;'
      case 62: // >
        return '&gt;'
      default:
        return ch;
    }
  })}"`;
}