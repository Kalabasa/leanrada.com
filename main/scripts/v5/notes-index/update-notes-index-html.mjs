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

  const rewriter = new HTMLRewriter();

  rewriter.on("#notes", {
    element(element) {
      let innerContent = "";

      for (const item of index) {
        // if (attrs.yearHeadings) {
        //   const itemYear = new Date(item.date).getFullYear();
        //   if (year !== itemYear) {
        //     year = itemYear;
        //     yield`<h3 class="blog-list-heading">${formatYearHeading(year)}</h3>`;
        //   }
        // }
        innerContent += renderNoteListItem(item).replaceAll("\n", "\n  " + ulIndent);
      }

      innerContent = `\n${ulIndent}<ul>${innerContent}\n${ulIndent}</ul>\n${ulIndent}`;

      element.setInnerContent(innerContent, { html: true });
      element.setAttribute(
        "data-generated",
        new Date().toISOString().slice(0, 10)
      );
    },
  });

  return await rewriter.transform(new Response(notesIndexHTML)).text();
}
