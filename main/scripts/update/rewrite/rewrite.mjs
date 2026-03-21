import { HTMLRewriter } from "html-rewriter-wasm";
import fs from "node:fs/promises";
import { tryWrite } from "../util/try-write.mjs";

/**
 * @param {Object} opts
 * @param {string} opts.htmlFilePath
 * @param {(r: HTMLRewriter) => Promise<void> | void} opts.setup
 * @param {{ [string]: any }} [opts.data={}]
 * @param {boolean} [opts.dryRun=false]
 */
export async function rewrite({
  htmlFilePath,
  setup = () => {},
  data = {},
  dryRun = false,
}) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const chunks = [];

  const rewriter = new HTMLRewriter((chunk) => {
    chunks.push(chunk);
  });

  rewriter.on("[data-rewrite]", {
    element(element) {
      this.replacing = false;
      const key = element.getAttribute("data-rewrite");
      if (!data.hasOwnProperty(key) || data[key] == undefined) {
        return;
      }

      this.replacing = true;
      this.textBuffer = "";
      this.newContent = String(data[key]);
      element.onEndTag((endTag) => {
        this.replacing = false;
        if (this.textBuffer === this.newContent) {
          endTag.before(this.textBuffer);
        } else {
          endTag.before(this.newContent);
        }
      });
    },

    text(text) {
      if (!this.replacing) return;
      this.textBuffer += text.text;
      text.remove();
    },
  });

  await setup(rewriter);

  const sourceHTML = await fs.readFile(htmlFilePath);
  try {
    await rewriter.write(encoder.encode(String(sourceHTML)));
    await rewriter.end();
  } finally {
    rewriter.free();
  }
  const rewrittenHTML = decoder.decode(Buffer.concat(chunks));

  await tryWrite({
    filePath: htmlFilePath,
    origText: sourceHTML,
    text: rewrittenHTML,
    verb: "rewriting",
    dryRun,
  });
}
