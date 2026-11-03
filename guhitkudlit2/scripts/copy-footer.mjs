#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const siteDir = join(import.meta.dirname, "..", "site");
const footerPath = join(siteDir, "footer", "footer.html");
const footerHtml = readFileSync(footerPath, "utf8").trimEnd();
const footerPattern = /^( *)<footer id="footer">[\s\S]*?<\/footer>/m;

for (const relativePath of readdirSync(siteDir, { recursive: true })) {
  const pagePath = join(siteDir, relativePath);
  if (!pagePath.endsWith(".html") || pagePath === footerPath) {
    continue;
  }
  const pageHtml = readFileSync(pagePath, "utf8");
  const match = pageHtml.match(footerPattern);
  if (!match) {
    continue;
  }
  const indent = match[1];
  const indentedFooterHtml = footerHtml
    .split("\n")
    .map((line) => (line ? indent + line : line))
    .join("\n");
  writeFileSync(
    pagePath,
    pageHtml.replace(footerPattern, () => indentedFooterHtml),
  );
  console.log(relativePath);
}
