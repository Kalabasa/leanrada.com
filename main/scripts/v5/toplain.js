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

  input("content-header").each((i, el) => {
    const tag = input(el);
    const title = tag.attr("title");
    const subtitle = tag.attr("subtitle");
    let out = `<content-header>\n`;
    out += `  <h1>${title}</h1>\n`;
    if (subtitle) {
      out += `  <div>${subtitle}</div>\n`;
    }
    out += `</content-header>`;
    tag.remove();
    main.before(out + "\n\n");
  });

  input("blog-header").each((i, el) => {
    const tag = input(el);
    const title = tag.attr("title");
    const heroimgsrc =
      tag.attr("heroimgsrc")?.replace("{url('", "").replace("')}", "") ??
      tag.attr(":heroimgsrc")?.replace("url('", "").replace("')", "") ??
      "";
    let out = `<blog-header>\n`;
    out += `  <h1>${title}</h1>\n`;
    out += `  <img src="${heroimgsrc}" alt="" loading="lazy" />\n`;
    out += `</blog-header>`;
    tag.remove();
    main.before(out + "\n\n");
  });

  input("blog-post-info").each((i, el) => {
    const tag = input(el);
    const hidden = tag.attr("hidden") != null;
    const date = tag.attr("date");
    const readMins = tag.attr("read-mins");

    let out = `<blog-post-info${hidden ? " hidden" : ""}>\n`;
    const dateDate = new Date(date);
    const yyyy = dateDate.getFullYear();
    const mm = (dateDate.getMonth() + 1).toString().padStart(2, "0");
    const dd = dateDate.getDate().toString().padStart(2, "0");
    out += `  <time datetime="${yyyy}-${mm}-${dd}">${date}</time>\n`;
    out += `  · ${readMins} min read\n`;
    out += `</blog-post-info>`;
    tag.remove();
    main.before(out + "\n\n");
  });

  input("tag-row").each((i, el) => {
    const tagRow = input(el);

    tagRow.contents().each((i, node) => {
      if (node.type === "text") {
        input(node).remove();
      } else if (node.tagName === "tag") {
        const tag = input(node);
        tag.replaceWith(`\n  <tag-chip title="${tag.text()}"></tag-chip>`);
      }
    });
    tagRow.append("\n");

    main.before(tagRow);
    main.before("\n\n");
  });

  input("code-block").each((i, el) => {
    const tag = input(el);
    const language = tag.attr("language");
    const languageCode = tag.attr("language-code");
    const attrs =
      (language ? ` language=${language}` : "") +
      (languageCode ? ` languagecode=${languageCode}` : "");
    let codeBlock = `<code-block${attrs}><pre><code><![CDATA[`;
    const code = tag.attr("code") ?? eval(tag.attr(":code"));
    // escape to prevent markdown from breaking
    // will unescape later
    codeBlock += code
      .replaceAll("<", "&lt;")
      .replace(/^\n|\n$/g, "")
      .replace(/\n/g, "&NewLine;");
    codeBlock += `]]></code></pre></code-block>`;
    tag.replaceWith(codeBlock);
  });

  markdown.contents().each((i, node) => {
    if (node.type === "text") {
      node.data = node.data.replace(indentPattern, "");
    }
  });
  const convertedMarkdown = marked.parse(markdown.html());
  main.append(convertedMarkdown);

  output('a,btn[tag="aa"],text-link').each(
    trace((i, el) => {
      const tag = output(el);

      if (el.tagName === "a" && !tag.attr("href")) {
        return;
      }

      if (el.tagName === "btn") {
        tag.addClass("button");
        tag.removeAttr("tag");
      }

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

      el.tagName = "a";
    })
  );

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

    const type = tag.attr("type");
    if (type === "windowed") {
      if (caption) {
        out = `${out}<figcaption>${caption}</figcaption>`;
      }
      out = `<window-decor>${out}</window-decor>`;
      if (caption) {
        out = `<figure>${out}</figure>`;
      }
    } else {
      if (type === "bleed") {
        out = `<prose-bleed>${out}</prose-bleed>`;
      }
      if (caption) {
        out = `<figure>${out}<figcaption>${caption}</figcaption></figure>`;
      }
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
    // unescape
    tag.html(
      tag
        .html()
        .replace(/(?<=<code>)<!\[CDATA\[/, "")
        .replace(/\]\]>(?=<\/code>)/, "")
        .replace(/&NewLine;/g, "\n")
    );

    if (tag.parent().is("p")) {
      tag.parent().replaceWith(tag);
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

function trace(eachCallback) {
  return (i, el) => {
    try {
      return eachCallback(i, el);
    } catch (e) {
      console.error(i, el);
      throw e;
    }
  };
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
