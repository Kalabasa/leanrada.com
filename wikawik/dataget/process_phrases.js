const glob = require("glob");
const path = require("path");
const fs = require("fs");
const parse = require("csv-parse/lib/sync");

const languages = require("./data/languages.json");

const files = glob.sync(path.resolve(__dirname, "../phrases/*.csv"));

/**
 * @type Map<string, { [language: string]: string }>
 */
const translationMap = new Map();

for (const file of files) {
  console.log(`Processing ${file}`);
  const rows = parse(fs.readFileSync(file), { columns: true });
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.ID || !row.LANGUAGE || !row.TEXT) {
      console.warn(`Invalid row ${i + 2}: ${JSON.stringify(row)}`);
      continue;
    }

    let mapping = translationMap.get(row.ID);
    if (!mapping) {
      mapping = {};
      translationMap.set(row.ID, mapping);
    }

    const language = normalizeLanguage(row.LANGUAGE);
    mapping[language] = row.TEXT.trim().toLocaleLowerCase();
  }
  console.log(`Processed ${rows.length} rows`);
}

function normalizeLanguage(languageName) {
  const key = languageName.trim().toLocaleLowerCase();
  return languages.synonyms[key] || key;
}

console.log("Total:");
console.log(
  "  " +
    [...translationMap.values()].flatMap((translations) =>
      Object.values(translations)
    ).length +
    " phrases"
);
console.log("  " + [...translationMap.keys()].length + " key phrases");
console.log(
  "  " +
    new Set(
      [...translationMap.values()].flatMap((translations) =>
        Object.keys(translations)
      )
    ).size +
    " languages"
);

const outFile = path.resolve(__dirname, "data", "phrases.json");
fs.writeFileSync(outFile, JSON.stringify(Object.fromEntries(translationMap)));
console.log("Wrote output to " + outFile);
