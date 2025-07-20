const fs = require("fs");
const path = require("path");

const masterPath = path.resolve(__dirname, "../../data/_app_songs.json");
const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));

for (const entry of master) {
  const jsonPath = path.join(path.dirname(masterPath), entry.json);
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const totalWordsPerLang = {};
  const uniqueWordsPerLang = {};

  for (const line of data.lyrics ?? []) {
    if (!line.lang) continue;
    const words = line.text.split(" ");
    totalWordsPerLang[line.lang] =
      (totalWordsPerLang[line.lang] ?? 0) + words.length;
    for (const word of words) {
      const normalised = word.replaceAll(/\W/g, "").toLowerCase();

      // skip non-speech
      if (normalised.match(/\b(y?(ea|a|o|u)+h)+\b/)) {
        continue;
      }

      (
        uniqueWordsPerLang[line.lang] ??
        (uniqueWordsPerLang[line.lang] = new Set())
      ).add(normalised);
    }
  }

  const uniqueCounts = {};
  for (const lang in uniqueWordsPerLang) {
    uniqueCounts[lang] = uniqueWordsPerLang[lang].size;
  }

  delete entry.multilingualism;
  entry.multilingualism = calculateMultilingualism(uniqueCounts);

  delete entry.multilingualismNonEng;
  delete uniqueCounts.eng;
  entry.multilingualismNonEng = calculateMultilingualism(uniqueCounts);

  delete entry.stats;
  entry.stats = totalWordsPerLang;
}

function calculateMultilingualism(stats) {
  const counts = Object.values(stats);
  const total = counts.reduce((a, b) => a + b, 0);
  const probs = counts.map((n) => n / total);
  return Math.round(-probs.reduce((sum, p) => sum + p * Math.log(p), 0) * 1000) / 1000;
}

fs.writeFileSync(masterPath, JSON.stringify(master, null, 2));
