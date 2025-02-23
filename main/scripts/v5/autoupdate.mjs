#!/usr/bin/env node
import path from "node:path";
import { readNotes } from "./notes/read-notes.mjs";
import { rewrite } from "./rewriter/rewriter.mjs";
import { dateString, indent, reindent } from "./format/format.mjs";
import { readWares } from "./wares/read-wares.mjs";
import { renderNoteListItem } from "./notes/render-note-list-item.mjs";

process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const projectRoot = process.cwd();
console.log("Project root:", projectRoot);
if (path.basename(projectRoot) !== "main") {
  throw new Error("Unexpected project root!");
}

const siteDir = path.resolve(projectRoot, "site");
const dryRun = process.argv.includes("--dry-run");

main();

async function main() {
  const [{ notes, noteReferences }, wares] = await Promise.all([
    readNotes(siteDir),
    readWares(siteDir),
  ]);

  await updateIndexHTML({
    notes,
    wares,
  });
}

async function updateIndexHTML({ notes, wares }) {
  const notesListIndent = 2;
  const latestNotes = notes
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  await rewrite({
    htmlFilePath: path.resolve(siteDir, "index.html"),
    data: {
      noteCount: notes.filter((w) => w.public).length,
      wareCount: wares.filter((w) => w.public).length,
    },
    setup(rewriter) {
      rewriter.on("notes-list#latest-notes", {
        element(element) {
          let items = "";

          for (const item of latestNotes) {
            items += renderNoteListItem(item);
          }

          const innerHTML =
            `\n${indent(notesListIndent + 1)}` +
            `<ul>${reindent(items, notesListIndent + 2)}` +
            `\n${indent(notesListIndent + 1)}</ul>` +
            `\n${indent(notesListIndent)}`;

          element.setInnerContent(innerHTML, { html: true });
          element.setAttribute("data-rewritten", dateString());
        },
      });
    },
    dryRun,
  });
}
