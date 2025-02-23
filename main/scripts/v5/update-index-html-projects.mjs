#!/usr/bin/env node
import glob from "glob";
import path from "node:path";
import fs from "node:fs/promises";
import { HTMLRewriter } from "@miniflare/html-rewriter";

process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const projectRoot = process.cwd();
console.log(projectRoot);

const site = path.resolve(projectRoot, "site");
const waresDir = path.resolve(site, "wares");
const dryRun = process.argv.includes("--dry-run");

main();

async function main() {
  const subPages = glob.sync(path.resolve(waresDir, "*", "index.html"));
  const totalPublicProjects = (
    await Promise.all(
      subPages.map(async (page) => {
        const dir = path.dirname(page);
        // Underscore-prefixed directories are unpublished.
        return { public: !path.basename(dir).startsWith("_") };
      })
    )
  ).filter((item) => item.public).length;

  const rewriter = new HTMLRewriter();

  rewriter.on("#project-count", {
    element(element) {
      element.setInnerContent(String(totalPublicProjects));
    },
  });

  const indexHTMLPath = path.resolve(site, "index.html");
  const indexHTML = await fs.readFile(indexHTMLPath);
  const updatedIndexHTML = await rewriter
    .transform(new Response(indexHTML))
    .text();
  if (!dryRun) {
    console.log("Rewriting", path.relative(process.cwd(), indexHTMLPath));
    await fs.writeFile(indexHTMLPath, updatedIndexHTML);
  }
}
