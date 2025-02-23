import { HTMLRewriter } from "@miniflare/html-rewriter";
import fs from "node:fs/promises";
import path from "node:path";
import { dateString } from "../format/format.mjs";
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
  const rewriter = new HTMLRewriter();

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
          endTag
            .before(this.newContent)
            .before(`<!--${dateString()}-->`, { html: true });
        }
      });
    },

    text(text) {
      if (!this.replacing) return;
      this.textBuffer += text.text;
      text.remove();
    },

    comments(comment) {
      if (this.replacing && this.textBuffer !== this.newContent) {
        comment.remove();
      }
    },
  });

  await setup(rewriter);

  const sourceHTML = await fs.readFile(htmlFilePath);
  const rewrittenHTML = await rewriter
    .transform(new Response(sourceHTML))
    .text();
  await tryWrite({
    filePath: htmlFilePath,
    origText: sourceHTML,
    text: rewrittenHTML,
    verb: "rewriting",
    dryRun,
  });
}
