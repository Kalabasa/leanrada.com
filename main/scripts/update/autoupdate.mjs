#!/usr/bin/env node
import path from "node:path";
import { dateString, indent, reindent } from "./format/format.mjs";
import { fetchGitHubContribs } from "./misc/fetch-gh-contribs.mjs";
import { fetchHits } from "./misc/fetch-hits.mjs";
import { fetchStackOverflowReputation } from "./misc/fetch-so-rep.mjs";
import { populateSuggestions } from "./notes/populate-suggestions.mjs";
import { readNotes } from "./notes/read-notes.mjs";
import { renderNoteListItem } from "./notes/render-note-list-item.mjs";
import { rewrite } from "./rewrite/rewrite.mjs";
import { updateRSS } from "./rss/update-rss.js";
import { readWares } from "./wares/read-wares.mjs";
import { tryWrite } from "./util/try-write.mjs";

process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const projectRoot = process.cwd();
console.log("Project root:", projectRoot);
if (path.basename(projectRoot) !== "main") {
  throw new Error("Unexpected project root!");
}

const siteDir = path.resolve(projectRoot, "site");
const dryRun = process.argv.includes("--dry-run");

const options = parseOptionArgs([
  "notes",
  "wares",
  "hits",
  "gh-contribs",
  "so-rep",
]);
main();

async function main() {
  console.group("Loading data...");
  const [notes, wares, hits, ghContribs, soRep] = await Promise.all([
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
    optional("gh-contribs", () =>
      fetchGitHubContribs().catch(fallback("gh-contribs"))
    ),
    optional("so-rep", () =>
      fetchStackOverflowReputation().catch(fallback("so-rep"))
    ),
  ]);
  console.groupEnd();

  console.log("Loaded data:", {
    notes: notes?.length,
    wares: wares?.length,
    hits,
    ghContribs: ghContribs?.flat().length,
    soRep,
  });

  const rssFilePath = path.resolve(siteDir, "rss.xml");

  console.group("Updating files...");
  await Promise.all([
    updateIndexHTML({
      notes,
      wares,
      hits,
    }),
    updateMiscIndexHTML({
      hits,
      soRep,
    }),
    updateNotesIndexJson({ notes }),
    updateNotesIndexHTML({ notes }),
    updateComponentsGhContribsJson({ ghContribs }),
    updateRSS({ rssFilePath, notes, siteDir, dryRun }),
  ]);
  console.groupEnd();

  console.log("Done!");
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

function parseOptionArgs(options) {
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
  if (!notes && !wares && !hits) return;

  const notesListIndent = 2;
  const latestNotes = notes?.filter(n => n.public).slice(0, 4);

  await rewrite({
    htmlFilePath: path.resolve(siteDir, "index.html"),
    data: {
      noteCount: notes?.filter((n) => n.public).length,
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
          },
        });
      }
    },
    dryRun,
  });
}

async function updateMiscIndexHTML({ hits, soRep }) {
  if (!hits && !soRep) return;

  await rewrite({
    htmlFilePath: path.resolve(siteDir, "misc", "index.html"),
    data: {
      hits,
      soRep,
    },
    dryRun,
  });
}

async function updateNotesIndexJson({ notes }) {
  if (!notes) return;
  await writeJSON(
    path.resolve(siteDir, "notes", "index.generated.combined.json"),
    notes
  );
}

async function updateNotesIndexHTML({ notes }) {
  if (!notes) return;

  const notesListIndent = 1;

  let list = notes.filter((item) => item.public);
  if (process.env.NODE_ENV === "development") {
    list = notes
      .filter((item) => !item.public)
      .map((item) => ({
        ...item,
        date: String(new Date().getFullYear() + 1),
        tags: ["✎hidden", ...item.tags],
      }))
      .concat(list);
  }

  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  await rewrite({
    htmlFilePath: path.resolve(siteDir, "notes", "index.html"),
    setup(rewriter) {
      rewriter.on("notes-list#notes", {
        element(element) {
          let innerHTML = "";
          let year = -1;

          for (const item of list) {
            const itemYear = new Date(item.date).getFullYear();
            if (year !== itemYear) {
              if (year >= 0) {
                innerHTML += `\n${indent(notesListIndent + 1)}</ul>`;
              }
              year = itemYear;
              innerHTML +=
                `\n${indent(notesListIndent + 1)}<h3>${year}</h3>` +
                `\n${indent(notesListIndent + 1)}<ul>`;
            }
            innerHTML += reindent(
              renderNoteListItem(item, "no-year"),
              notesListIndent + 2
            );
          }

          innerHTML +=
            `\n${indent(notesListIndent + 1)}</ul>` +
            `\n${indent(notesListIndent)}`;
          element.setInnerContent(innerHTML, { html: true });
        },
      });
    },
    dryRun,
  });
}

async function updateComponentsGhContribsJson({ ghContribs }) {
  if (!ghContribs) return;
  await writeJSON(
    path.resolve(siteDir, "components", "gh-contribs", "gh-contribs.json"),
    ghContribs
  );
}

async function writeJSON(filePath, data) {
  await tryWrite({
    filePath,
    text: JSON.stringify(data, undefined, "\t"),
    verb: "writing",
    dryRun,
  });
}
