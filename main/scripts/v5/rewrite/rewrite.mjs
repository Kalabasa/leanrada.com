import { HTMLRewriter } from "@miniflare/html-rewriter";
import path from "node:path";
import fs from "node:fs/promises";
import { dateString } from "../format/format.mjs";

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
        if (this.textBuffer !== this.newContent) {
          endTag.before(`<!--${dateString()}-->`, { html: true });
        }
      });
    },

    text(text) {
      if (!this.replacing) return;

      this.textBuffer += text.text;

      if (text.lastInTextNode) {
        if (this.textBuffer !== this.newContent) {
          text.replace(this.newContent);
        } else {
          text.replace(this.textBuffer);
        }
      } else {
        text.remove();
      }
    },

    comments(comment) {
      if (this.replacing && this.textBuffer !== this.newContent) {
        comment.remove();
      }
    },
  });

  await setup(rewriter);

  const resolvedPath = path.resolve(htmlFilePath);
  const sourceHTML = await fs.readFile(resolvedPath);
  const rewrittenHTML = await rewriter
    .transform(new Response(sourceHTML))
    .text();
  if (dryRun) {
    console.log("Not rewriting:", path.relative(process.cwd(), resolvedPath));
  } else {
    console.log("Rewriting:", path.relative(process.cwd(), resolvedPath));
    await fs.writeFile(resolvedPath, rewrittenHTML);
  }
}
