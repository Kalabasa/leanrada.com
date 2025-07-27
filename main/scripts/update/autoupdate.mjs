#!/usr/bin/env node
import path from "node:path";
import { indent, reindent } from "./format/format.mjs";
import { initScript } from "./lib/script.mjs";
import { fetchGitHubContribs } from "./misc/fetch-gh-contribs.mjs";
import { fetchHits } from "./misc/fetch-hits.mjs";
import { fetchStackOverflowReputation } from "./misc/fetch-so-rep.mjs";
import { populateSuggestions } from "./notes/populate-suggestions.mjs";
import { readNotes } from "./notes/read-notes.mjs";
import { renderNoteListItem } from "./notes/render-note-list-item.mjs";
import { rewrite } from "./rewrite/rewrite.mjs";
import { updateRSS } from "./rss/update-rss.js";
import { tryWrite } from "./util/try-write.mjs";
import { readWares } from "./wares/read-wares.mjs";
import { fetchGuestbookData } from "./guestbook/fetch-guestbook-data.js";
import { createGuestbookCard } from "../../site/guestbook/guestbook-card.js";
import { populateStats } from "./notes/populate-stats.mjs";

const { siteDir } = initScript();

const dryRun = process.argv.includes("--dry-run");
const options = parseOptionArgs([
  "notes",
  "wares",
  "guestbook",
  "hits",
  "gh-contribs",
  "so-rep",
]);

main();

async function main() {
  console.group("Loading data...");
  const [notes, wares, guestbook, hits, ghContribs, soRep] = await Promise.all([
    optional("notes", () =>
      (async () => {
        const { notes, noteReferences, existingNotes } = await readNotes(
          siteDir
        );
        populateSuggestions({
          notes,
          noteReferences,
          maxSmartSuggestions: 3,
          maxSuggestions: 4,
        });
        await populateStats({ notes, existingNotes });
        return notes;
      })().catch(fallback("notes"))
    ),
    optional("wares", () => readWares(siteDir)),
    optional("guestbook", () =>
      fetchGuestbookData(0).catch(fallback("guestbook"))
    ),
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
    guestbook: guestbook?.length,
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
    updateGuestbookIndexHTML({ guestbook }),
    updateComponentsGhContribsJson({ ghContribs }),
    notes && updateRSS({ rssFilePath, notes, siteDir, dryRun }),
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
  const latestNotes = notes?.filter((n) => n.public).slice(0, 4);

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

async function updateGuestbookIndexHTML({ guestbook }) {
  if (!guestbook) return;

  const messagesListIndent = 2;
  const list = guestbook.slice(0, 15);

  await rewrite({
    htmlFilePath: path.resolve(siteDir, "guestbook", "index.html"),
    setup(rewriter) {
      rewriter.on("#messages-list", {
        element(element) {
          let innerHTML = "";
          for (const item of list) {
            innerHTML += reindent(
              "\n" + createGuestbookCard(item),
              messagesListIndent
            );
          }
          innerHTML += `\n${indent(messagesListIndent - 1)}`;
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
