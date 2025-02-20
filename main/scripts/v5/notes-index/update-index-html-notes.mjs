import { HTMLRewriter } from "@miniflare/html-rewriter";
import { renderNoteListItem } from "./render-note-list-item.mjs";

const dev = process.env.NODE_ENV === "development";

const ulIndent = "      ";

export async function updateIndexHTMLNotes(combinedIndex, indexHTML) {
  let index = combinedIndex.filter((item) => item.public);

  const totalPublicNotes = index.length;

  if (dev) {
    index = combinedIndex
      .filter((item) => !item.public)
      .map((item) => ({
        ...item,
        date: String(new Date().getFullYear() + 1),
        tags: ["✎hidden", ...item.tags],
      }))
      .concat(index);
  }

  index = index.slice(0, 4);

  const rewriter = new HTMLRewriter();

  rewriter.on("#note-count", {
    element(element) {
      element.setInnerContent(String(totalPublicNotes));
    },
  });

  rewriter.on("#latest-notes", {
    element(element) {
      let innerContent = "";

      for (const item of index) {
        innerContent += renderNoteListItem(item).replaceAll(
          "\n",
          "\n  " + ulIndent
        );
      }

      innerContent = `\n${ulIndent}<ul>${innerContent}\n${ulIndent}</ul>\n${ulIndent}`;

      element.setInnerContent(innerContent, { html: true });
      element.setAttribute(
        "data-generated",
        new Date().toISOString().slice(0, 10)
      );
    },
  });

  return await rewriter.transform(new Response(indexHTML)).text();
}
