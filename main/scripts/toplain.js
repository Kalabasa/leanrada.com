const fs = require("fs");
const cheerio = require("cheerio");
const marked = require("marked");
const path = require("path");

const indentPattern = new RegExp(`^ {0,6}`, "gm");

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

  const markdown = input("markdown");
  markdown.contents().each((i, node) => {
    if (node.type === "text") {
      node.data = node.data.replace(indentPattern, "");
    }
  });
  const convertedMarkdown = marked.parse(markdown.html());
  main.append(convertedMarkdown);

  output("a,text-link").each((i, el) => {
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
      throw new Error(`Unsupported media src: '${src}'`);
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

    const button = tag.attr("button");
    if (button) {
      card += `<a href="${tag.attr("href")}" target="_blank">${button}</a>`;
    }

    card += `<dl>`;
    ["released", "status", "role", "platform", "tech"].forEach((attr) => {
      if (tag.attr(attr)) {
        card += `<dt>${attr}</dt><dd>${tag.attr(attr)}</dd>`;
      }
    });

    card += `</dl></project-info-card>`;
    tag.replaceWith(card);
  });

  output("code-block").each((i, el) => {
    const tag = output(el);
    let codeBlock = `<code-block language=${tag.attr("language")}><pre><code>`;
    const code = tag.attr("code") ?? eval(tag.attr(":code"));
    codeBlock += code.replace(/^\n|\n$/g, "");
    codeBlock += `</code></pre></code-block>`;
    if (tag.parent().is("p")) {
      tag.parent().replaceWith(codeBlock);
    } else {
      tag.replaceWith(codeBlock);
    }
  });

  return output.html().replace(/<\/?(html|head|body)>/g, "");
}

const input = process.argv[2];
let inputFile;
if (input) {
  if (input.endsWith(".html")) {
    inputFile = path.basename(input);
    console.log(
      "Working directory",
      path.relative(process.cwd(), path.dirname(input))
    );
    process.chdir(path.dirname(input));
  } else {
    if (input) {
      console.log(
        "Working directory",
        path.relative(process.cwd(), path.resolve(input))
      );
      process.chdir(input);
    }
    inputFile = fs.existsSync("index.original.html")
      ? "index.original.html"
      : "index.html";
  }
}

console.log("Reading", inputFile);
const inputString = fs.readFileSync(inputFile, "utf8");

const copyFile = inputFile.endsWith(".original.html")
  ? inputFile
  : path.basename(inputFile, ".html") + ".original.html";
console.log("Copying", inputFile, "→", copyFile);
fs.writeFileSync(copyFile, inputString);

const convertedHtml = convertToWebComponents(inputString);

const outputFile = inputFile.endsWith(".original.html")
  ? path.basename(inputFile, ".original.html") + ".html"
  : inputFile;
console.log("Writing result", outputFile);
fs.writeFileSync(outputFile, convertedHtml, "utf8");

console.log("Done!");
