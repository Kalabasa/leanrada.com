import glob from "glob";
import path from "node:path";
import fs from "node:fs/promises";
import * as cheerio from "cheerio";

// returns notes and statically defined items in descending date order
export async function readNotes(siteDir) {
  console.log("Reading notes...");
  const pages = glob.sync(path.resolve(siteDir, "notes", "*", "index.html"));
  const noteReferences = new Map();

  const notes = await Promise.all(
    pages.map(async (page) => {
      const dir = path.dirname(page);
      const name = path.basename(dir);
      const href = `/notes/${name}/`;
      const isPublic = !name.startsWith("_");
      try {
        // HTML is the source of truth
        const code = await fs.readFile(page);
        const ch = cheerio.load(code);

        const title = ch("title").text();
        if (!title) throw new Error("No title!");

        const firstMedia = ch(
          "blog-header img, blog-header video, main img, main video"
        ).attr("src");
        const media =
          firstMedia && !firstMedia.startsWith("/")
            ? path.join(href, firstMedia)
            : undefined;

        const date = ch("blog-post-info time").attr("datetime");
        if (!date) {
          console.error("No date for page:", title);
          if (isPublic) {
            throw new Error("No date!");
          }
        }

        const tags = ch("tag-row tag-chip")
          .map(function () {
            return ch(this).attr("title");
          })
          .toArray();

        const content = ch("main.prose");
        if (!content) {
          console.error("No content for page:", title);
          throw new Error("No content!");
        }

        if (isPublic) {
          const refdNotePaths =
            content.html().match(/(?<=\/)notes\/[A-Za-z0-9\-]+\b/g) ?? [];
          for (const path of refdNotePaths) {
            const otherHref = `/${path}/`;

            if (href === otherHref) continue;

            multimapAdd(noteReferences, href, otherHref);
            multimapAdd(noteReferences, otherHref, href);
          }
        }

        return {
          name,
          href,
          title,
          media,
          date,
          public: isPublic,
          tags,
          suggestions: [],
        };
      } catch (error) {
        console.error("Error while processing:", href);
        throw error;
      }
    })
  );

  const staticIndex = JSON.parse(
    await fs.readFile(path.resolve(siteDir, "notes", "index.static.json"))
  );
  const combinedNotes = notes
    .concat(staticIndex)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  console.log(
    "Notes:",
    combinedNotes.length,
    "References:",
    noteReferences.size
  );
  return { notes: combinedNotes, noteReferences };
}

function multimapAdd(map, key, value) {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  set.add(value);
}
