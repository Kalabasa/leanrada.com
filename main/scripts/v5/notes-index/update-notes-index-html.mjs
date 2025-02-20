import { HTMLRewriter } from "@miniflare/html-rewriter";
import { renderNoteListItem } from "./render-note-list-item.mjs";

const dev = process.env.NODE_ENV === "development";

const ulIndent = "    ";

export async function updateNotesIndexHTML(combinedIndex, notesIndexHTML) {
  let index = combinedIndex.filter((item) => item.public);

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

  index.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const rewriter = new HTMLRewriter();

  rewriter.on("#notes", {
    element(element) {
      let innerContent = "";

      let year = -1;

      for (const item of index) {
        const itemYear = new Date(item.date).getFullYear();
        if (year !== itemYear) {
          if (year >= 0) {
            innerContent += `\n${ulIndent}</ul>`;
          }
          year = itemYear;
          innerContent += `<h3>${year}</h3>\n${ulIndent}<ul>`;
        }
        innerContent += renderNoteListItem(item, "no-year").replaceAll(
          "\n",
          "\n  " + ulIndent
        );
      }

      innerContent = `${innerContent}\n${ulIndent}</ul>\n${ulIndent}`;

      element.setInnerContent(innerContent, { html: true });
      element.setAttribute(
        "data-generated",
        new Date().toISOString().slice(0, 10)
      );
    },
  });

  return await rewriter.transform(new Response(notesIndexHTML)).text();
}
