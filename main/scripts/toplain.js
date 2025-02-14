const fs = require("fs");
const cheerio = require("cheerio");
const marked = require("marked");

const markdownIndent = 6;

function convertToWebComponents(inputHtml) {
  const input = cheerio.load(inputHtml, {
    xml: true,
    decodeEntities: false,
  });

  const title = input("page-title").attr("title") ?? "Untitled";

  let newHtml = `\
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="/common.css" />
<script defer src="/common.js"></script>

<title>${title}</title>

<site-header></site-header>

<main class="prose"></main>

<article-footer></article-footer>

<site-footer></site-footer>`;

  const output = cheerio.load(newHtml, {
    xml: true,
    selfClosingTags: false,
    decodeEntities: false,
  });
  const main = output("main");

  const markdownContent = input("markdown").html() ?? "";
  const trimmedMarkdown = markdownContent.replace(
    new RegExp(`^ {${markdownIndent}}`, "gm"),
    ""
  );
  const convertedMarkdown = marked.parse(trimmedMarkdown);
  main.append(convertedMarkdown);

  output("a").each((i, el) => {
    const tag = output(el);
    if (!tag.attr("target")) {
      const href = tag.attr("href");
      if (
        href.startsWith("http:") ||
        href.startsWith("https:") ||
        href.startsWith("//")
      ) {
        tag.attr("target", "_blank");
      }
    }
  });

  output("blog-media").each((i, el) => {
    const tag = output(el);
    const src =
      tag.attr("src")?.replace("{url('", "").replace("')}", "") ??
      tag.attr(":src")?.replace("url('", "").replace("')", "") ??
      "";
    const alt = tag.attr("alt") ?? "";
    const caption = tag.attr("caption");

    let out;
    if (src.endsWith(".png") || src.endsWith(".jpg") || src.endsWith(".gif")) {
      out = `<img alt="${alt}" src="${src}" loading="lazy" />`;
    } else if (src.endsWith(".mp4")) {
      out = `<video autoplay muted loop playsinline aria-label="${alt}" src="${src}" loading="lazy"></video>`;
    } else {
      throw new Error("unsupported media src");
    }

    if (tag.attr("type") === "windowed") {
      out = `<window-decor>${out}</window-decor>`;
    } else if (tag.attr("type") === "bleed") {
      out = `<prose-bleed>${out}</prose-bleed>`;
    }

    if (caption) {
      out = `<figure>${out}<figcaption>${caption}</figcaption></figure>`;
    }

    tag.replaceWith(out);
  });

  output("project-info-card").each((i, el) => {
    const tag = output(el);
    let card = `<project-info-card><strong>Project details</strong>`;
    card += `<a href="${tag.attr("href")}" target="_blank">${tag.attr(
      "button"
    )}</a><dl>`;

    ["released", "status", "role", "platform", "tech"].forEach((attr) => {
      if (tag.attr(attr)) {
        card += `<dt>${attr}</dt><dd>${tag.attr(attr)}</dd>`;
      }
    });

    card += `</dl></project-info-card>`;
    tag.replaceWith(card);
  });

  return output.html().replace(/<\/?(html|head|body)>/g, "");
}

const inputFile = fs.existsSync("index.original.html")
  ? "index.original.html"
  : "index.html";
console.log("Reading", inputFile);
const inputString = fs.readFileSync(inputFile, "utf8");
fs.writeFileSync("index.original.html", inputString);
const convertedHtml = convertToWebComponents(inputString);
fs.writeFileSync("index.html", convertedHtml, "utf8");
console.log("Conversion complete!");
