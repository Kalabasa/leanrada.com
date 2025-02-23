#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { dateString, indent, reindent } from "./format/format.mjs";
import { fetchHits } from "./misc/fetch-hits.mjs";
import { readNotes } from "./notes/read-notes.mjs";
import { renderNoteListItem } from "./notes/render-note-list-item.mjs";
import { rewrite } from "./rewrite/rewrite.mjs";
import { readWares } from "./wares/read-wares.mjs";
import { populateSuggestions } from "./notes/populate-suggestions.mjs";

process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const projectRoot = process.cwd();
console.log("Project root:", projectRoot);
if (path.basename(projectRoot) !== "main") {
  throw new Error("Unexpected project root!");
}

const siteDir = path.resolve(projectRoot, "site");
const dryRun = process.argv.includes("--dry-run");

const options = parseOptionArgs();
main();

async function main() {
  console.group("Loading data...");
  const [notes, wares, hits] = await Promise.all([
    optional("notes", async () => {
      const { notes, noteReferences } = await readNotes(siteDir);
      populateSuggestions({
        notes,
        noteReferences,
        maxSmartSuggestions: 3,
        maxSuggestions: 4,
      });
      return notes;
    }),
    optional("wares", () => readWares(siteDir)),
    optional("hits", () => fetchHits().catch(fallback("hits"))),
  ]);
  console.groupEnd();

  console.log("Loaded data:", {
    notes: notes?.length,
    wares: wares?.length,
    hits,
  });

  console.group("Updating files...");
  await updateIndexHTML({
    notes,
    wares,
    hits,
  });
  await updateNotesIndexJson({ notes });
  await updateNotesIndexHTML({ notes });
  console.groupEnd();
}

function optional(name, getter) {
  return options[name].enable ? getter() : undefined;
}

function fallback(name) {
  return (thrown) => {
    console.error(`Error loading data for '${name}':`, thrown.message);
    console.error(thrown.cause);
    return undefined;
  };
}

function parseOptionArgs() {
  const options = ["notes", "wares", "hits"];
  const optionArgs = options
    .map((name) => {
      const no = process.argv.includes(`--no-${name}`);
      const only = process.argv.includes(`--only-${name}`);
      return { name, no, only };
    })
    .reduce((acc, opt) => {
      acc[opt.name] = opt;
      return acc;
    }, Object.create(null));

  return options
    .map((name) => ({
      name,
      enable:
        !optionArgs[name].no &&
        !options
          .filter((otherName) => otherName !== name)
          .some((otherName) => optionArgs[otherName].only),
    }))
    .reduce((acc, opt) => {
      acc[opt.name] = opt;
      return acc;
    }, Object.create(null));
}

async function updateIndexHTML({ notes, wares, hits }) {
  const notesListIndent = 2;
  const latestNotes = notes?.slice(0, 4);

  await rewrite({
    htmlFilePath: path.resolve(siteDir, "index.html"),
    data: {
      noteCount: notes?.filter((w) => w.public).length,
      wareCount: wares?.filter((w) => w.public).length,
      hits,
    },
    setup(rewriter) {
      if (notes) {
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
      }
    },
    dryRun,
  });
}

async function updateNotesIndexJson({ notes }) {
  if (!notes) return;

  const notesIndexJsonPath = path.resolve(
    siteDir,
    "notes",
    "index.generated.combined.json"
  );

  const relativePath = path.relative(process.cwd(), notesIndexJsonPath);
  if (dryRun) {
    console.log("Not writing", relativePath);
  } else {
    console.log("Writing", relativePath);
    await fs.writeFile(
      notesIndexJsonPath,
      JSON.stringify(notes, undefined, "\t")
    );
  }
}
