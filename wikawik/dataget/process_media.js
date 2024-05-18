const glob = require("glob");
const path = require("path");
const fs = require("fs");
const parse = require("csv-parse/lib/sync");

const languages = require("./data/languages.json");

const files = glob.sync(path.resolve(__dirname, "../media/*.csv"));

const media = [];

for (const file of files) {
  console.log(`Processing ${file}`);
  const rows = parse(fs.readFileSync(file), { columns: true });
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.LANGUAGE || !row.TITLE || !row.URL || !row.TYPE || !row.ID) {
      console.warn(`Invalid row ${i + 2}: ${JSON.stringify(row)}`);
      continue;
    }

    const language = normalizeLanguage(row.LANGUAGE);
    const title = row.TITLE;
    const description = row.DESCRIPTION;
    const url = row.URL;
    const type = row.TYPE;
    const id = row.ID;

    media.push({
      language,
      title,
      description,
      url,
      type,
      id,
    });
  }
  console.log(`Processed ${rows.length} rows`);
}

function normalizeLanguage(languageName) {
  const key = languageName.trim().toLocaleLowerCase();
  return languages.synonyms[key] || key;
}

console.log(`Total:  ${media.length} media`);

const outFile = path.resolve(__dirname, "data", "media.json");
fs.writeFileSync(outFile, JSON.stringify(media));
console.log("Wrote output to " + outFile);
