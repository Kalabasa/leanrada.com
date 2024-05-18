const xlsx = require("xlsx");
const glob = require("glob");
const path = require("path");
const fs = require("fs");
const { MERGE_MAP, areaNameToCode } = require("./common.js");

const kwfLanguages = require("./data/kwf.json");

// Note: PSA census data isn't very accurate in languages. I guess it's because they are self-reported. People often mix up the name of the ethnic group with the name of the larger language, or think of the dialect as a language. And the languages themselves aren't as clear-cut as well. And there are some inconsistencies between Ethnologue and KWF. The hardcoded lists here attempts to fix up the inconsistencies for the sake of visualization.

// Note: The goal of this project is to showcase the various langauges of the Philippines. There is a bias for minority langauges as they are rarely heard or seen. There is also a bias for visibility over accuracy.

// filter out very small populations
const MIN_PROPORTION_P = 0.01;
const MIN_PROPORTION_Q = 0.4;

// Don't count these languages from the census
const BLACKLIST = [
  "Other Local Dialects",
  "American/English",
  "Other Foreign Languages",
];

// Data cleanup
// I'm sure there are many errors here...
// Big source: https://www.sil.org/system/files/reapdata/11/94/33/119433657606644558451092246165824690951/A_DECIMAL_CLASSIFICATION_FOR_PHILIPPINE_LANGUAGES_optimized.pdf
const FORCE_SYNONYMS = [
  // Dialects combined
  [
    "chavacano",
    "chabacano",
    "zambageño-chavacano",
    "caviteño-chavacano",
    "cotabateño-chavacano",
    "davao-chavacano",
    "zambageño",
    "caviteño",
    "cotabateño",
  ],
  // Bisaya/Binisaya is generic term for the major Visayas languages (Cebuano, Waray, Hiligaynon)
  // Generic Bisaya/Binisaya specified as Cebuano
  // Boholano is a dialect of Cebuano
  ["cebuano", "bisaya", "binisaya", "boholano"],
  // The Sama-Bajau people are widely dispersed across the Sulu Archipelago, Malaysia, and Indonesia and their languages are related but not quite mutually intelligible. The labeling is confusing.
  [
    "sinama",
    "sama",
    "sama bangingi",
    "sama laut",
    "sama badjao",
    "sama badajo", // mispelling in data
    "badjao",
    "bajao",
    "bajaw",
    "jama mapun",
  ],
  // Dialects combined. https://ncca.gov.ph/about-culture-and-arts/culture-profile/glimpses-peoples-of-the-philippines/kalagan/
  ["kalagan", "tagakaulo"],
  // Prefer native word
  ["pangasinense", "pangasinan"],
  // Prefer native word. Subgroups.
  ["pala'wan", "palawano", "palaw-an", "ke'ney", "molbog"],
  // Prefer language name instead of people name
  ["gaddang", "baliwon", "ga'dang"],
  // Prefer native name; Dialects combined
  ["binukid", "bukidnon", "talaandig", "higaonon", "higaunon"],
  // Prefer native name;
  ["capizeño", "capiznon"],
  // Spelling; Generic Ifugao specified as Batad
  ["ifugao", "ifugaw", "batad", "ayangan", "henanga"],
  // Dialects;
  ["kankanaey", "applai", "bago"],
  // Dialects. Apparently Kalinga & Itneg share some dialects
  [
    "itneg",
    "maeng",
    "binongan",
    "inlaod",
    "masadiit",
    "balatok",
    "moyadan",
    "muyadan",
    "adasen",
  ],
  // Use prevalent spelling; Dialects. Apparently Kalinga & Itneg share some dialects
  ["kalinga", "kalingga", "calinga", "mabaka", "majokayong", "gubang", "banao"],
  // Remove generic qualifiers without introducing ambiguity
  ["buhid", "buhid mangyan"],
  ["alangan", "alangan mangyan"],
  ["bangon", "bangon mangyan", "buhid (bangon)"],
  ["gubatnon", "gubatnon mangyan"],
  ["tadyawan", "tadyawan mangyan"],
  ["hanunoo", "hanunuo", "hanunoo mangyan"],
  [
    "taubuid",
    "tawbuwid",
    "tau-buid",
    "taobuid",
    "tawbuwid mangyan",
    "bangon",
    "batangan",
  ],
  ["dibabawon", "manobo dibabawon", "mangguangan"],
  ["tagabawa", "bagobo-tagabawa"],
  ["aromanen", "aromanen-manobo", "manobo aromanen", "aromanen manobo"],
  ["obo", "manobo-ubo", "obu-manuvu", "tinananen"],
  ["kinamigin", "kamuigin", "manobo kinamigin"],
  ["dulangan", "manobo-dulangan", "manobo dulangan", "tasaday", "karulano"],
  ["matigsalug", "matigsalog", "manobo matigsalug"],
  ["kalamansig", "manobo kalamansig"],
  ["tigwahanon", "manobo tigwahanon", "tigwahanon manobo"],
  ["umirey", "dumagat", "agta dumagat umiray", "agta-dumagat"],
  ["magbikin", "magbekin", "ayta magbukun"],
  ["mag-antsi", "ayta mag-antsi", "mag-anti"],
  [
    "mag-indi aeta",
    "mag-indi",
    "indi ayta",
    "indi aeta",
    "ayta mag-indi",
    "indi",
  ],
  // Normalize qualifiers
  ["iraya mangyan", "iraya"], // vs iraya agta
  [
    "illanen manobo",
    "illanen",
    "manobo ilyanen",
    "livunganen",
    "dibabeen mulitaan",
  ], // vs iranun/illanun
  ["saranggani manobo", "manobo saranggani", "manobo-blit"],
  ["agusan manobo", "manobo agusan", "banwaon"],
  ["ata manobo", "ata-manobo", "manobo ata", "talaingod", "langilan"],
  ["iraya agta", "agta iraya"], // vs iraya mangyan
  [
    "iriga agta",
    "agta iriga",
    "iriga",
    "agta-tabangnon",
    "agta-cimaron",
    "agta-taboy",
  ],
  ["isarog agta", "agta isarog", "isarog"],
  ["casiguran agta", "agta dumagat casiguran"],
  ["pahanan agta", "paranan agta"],
  // Language name, People name
  ["atta", "agta-agay"],
  // Dialects
  ["itawis", "malaueg", "malaweg"],
  // Specific name for the major Chinese language in the Philippines
  ["fookien", "chinese"],
  // Prefer language name instead of people name
  ["tiruray", "teduray", "lambangian"],
  // Dialects
  ["subanen", "kalibugan"],
  // Native word
  ["asi", "bantoanon"],
  // Native spelling
  ["sambal", "zambal"],
  // Language word. Dialects https://www.haliya.co/stories/2017/6/23/panay-bukidnon-culture
  ["kinaray-a", "karay-a", "pan-ayanon", "halawodnon", "panay-bukidnon"],
  // Use prevalent spelling
  ["ilokano", "ilocano"],
  // Subgroups/dialects
  ["isneg", "apayao", "yapayao"],
  // Use prevalent spelling
  ["cuyonon", "cuyunon"],
  // Use prevalent spelling
  ["maguindanaon", "maguindanao"],
  // Prevalent spelling
  ["davawenyo", "davaweño"],
  // KWF says dialects, Wikipedia says separate languages. PSA says tagbanwa and calamian only.
  // http://kwf.gov.ph/wika/123/
  [
    "tagbanwa",
    "tagbanua",
    "apurawnon",
    "calamian",
    "kalamyan",
    "tagbanua (kalamianen)",
  ],
  // Spellings
  ["sangil", "sangire", "sangihe"],
  // Spellings
  ["sangil", "sangire", "sangihe"],
  // Spellings
  ["t'boli", "tboli", "tiboli"],
  // Prevalent word; Dialect
  ["romblomanon", "ini", "sibuyan mangyan-tagabukid"],
  // Spelling
  ["kagayanen", "cagayanen"],
  // Spelling https://ncca.gov.ph/about-culture-and-arts/culture-profile/glimpses-peoples-of-the-philippines/iwak/
  ["iwak", "iguwak", "iowak"],
  // Spelling
  ["paranan", "parananum"],
  // Spelling
  ["butuanon", "butwanon"],
  // Spelling
  ["surigaonon", "surigawnon"],
  // Dialect
  ["kalanguya", "kalanguya-ikalahan"],
  // Soelling
  ["magahat", "magahats"],
  // Language name, people name.
  ["manide", "kabihug"],
  // Spelling
  ["klata", "giangan", "guiangan", "diangan", "clata"],
  // Names. Dialects. Peoples.
  [
    "finontok",
    "finallig",
    "bontok",
    "bontoc",
    "balangaw",
    "belwang",
    "kadaklan",
  ],
  // Language names. People name.
  ["hatang kayi", "hatang kaye", "remontado"],
  // Dialects. No native name for group.
  ["western bukidnon manobo", "pulangien", "kirenteken"],
  // Names
  ["binatak", "batak"],
  // Spelling
  ["ivatan", "ibatan"],
  // Place (Sitio Kailawan)
  ["ata manobo", "kailawan"],
  // Spellings
  ["magkonana", "magkunana"],
];

// Disambiguiate language based on region
const LANGUAGE_LOCALISED_RENAME = {
  // PSA sometimes does not specify Aeta languages. There are many different Aeta/Agta languages.
  // This is a crude attempt to specify "Aeta/Agta" based on location
  // In general, it seems that: Aeta - West/Central Luzon, Agta - Northern/Eastern Luzon
  // Apayao
  "1481": {
    aeta: "atta",
    agta: "atta",
  },
  // Cagayan
  "0215": {
    aeta: "dupaningan",
    agta: "dupaningan",
  },
  // Isabela
  "0231": {
    agta: "paranan agta",
  },
  // Quirino
  "0257": {
    agta: "casiguran agta", // not really, but closest
  },
  // Bataan
  "0308": {
    aeta: "magbikin",
  },
  // Pampanga
  "0354": {
    aeta: "indi aeta",
  },
  // Tarlac
  "0369": {
    aeta: "abellen",
  },
  // Zambales
  "0371": {
    aeta: "mag-antsi",
  },
  // Aurora
  "0377": {
    agta: "casiguran agta",
  },
  // Quezon
  "0456": {
    dumagat: "remontado",
  },
  // Camarines Sur
  "0517": {
    agta: "iriga agta",
  },
  // Davao del Norte
  "1123": {
    aeta: "ata manobo", // ???
  },
  // PSA similarly lumps Manobo languages
  // Bukidnon
  "1013": {
    manobo: "tigwahanon manobo",
  },
  // Davao del Sur
  "1124": {
    manobo: "saranggani manobo",
  },
  // Davao Oriental
  "1125": {
    manobo: "saranggani manobo",
  },
  // Cotabato
  "1247": {
    manobo: "aromanen",
  },
  // Sultan Kudarat
  "1265": {
    manobo: "illanen manobo",
  },
  // Sarangani
  "1280": {
    manobo: "saranggani manobo",
  },
  // Agusan del Norte
  "1602": {
    manobo: "agusan manobo",
  },
  // Agusan del Sur
  "1603": {
    manobo: "agusan manobo",
  },
  // Surigao del Sur
  "1668": {
    manobo: "agusan manobo",
  },
  // PSA similarly uses generic term for Bagobo
  // There are two "Bagobo" languages according to KWF: Tagabawa and Klata
  // PSA distinguishes Bagobo-Tagabawa from Bagobo, so this other language must be Klata
  // Davao del Sur
  "1124": {
    bagobo: "klata",
  },
  // Cotabato
  "1247": {
    bagobo: "klata",
  },
};

// PSA merges some languages into other languages. Need to separate them back.
const FORCE_TRANSFER_HOUSEHOLDS = {
  // PSA does not specify Bikol languages. There are many different Bikol languages.
  // Let's specify the specific Bikol languages
  // Camarines Sur
  "0517": {
    // https://www.ethnologue.com/contribution/109586
    bikol: {
      rinkonada: 80851, // estimate: 380,000 Rinconada population / average household size
    },
  },
};

const SYNONYM_DELIMITER = /(?:\s*\/\s*)|(?:\s+or\s+)|(?<=Hiligaynon)\s+(?=Ilonggo)/gi;

let grandTotal = 0;
/**
 * @type Map<string, {[language: string]: number}>
 */
const countMap = new Map();
/**
 * @type Map<string, Set<String>>
 */
const synonymMap = new Map();

// Set hardcoded synonyms
for (const names of FORCE_SYNONYMS) {
  addSynonyms(names);
}

// Merge KWF synonyms
for (const language of kwfLanguages) {
  addSynonyms([language.name, ...(language.alts || [])]);
}

// Read xlsx data
const files = glob.sync(path.resolve(__dirname, "data/*.xls*"));

for (const file of files) {
  console.log("Processing file: " + file);
  const workbook = xlsx.readFile(file);
  const sheet = workbook.Sheets["H13"];

  const range = sheet["!ref"];
  const [rangeStart, rangeEnd] = range.split(":");
  const rowEnd = parseInt(rangeEnd.match(/\d+/)[0]);

  const array = xlsx.utils.sheet_to_json(sheet, {
    header: ["language", "number"],
    range: `${rangeStart}:B${rowEnd - 1}`,
  });

  const totalRow = array.findIndex((row) => row.language === "Total");
  const total = array[totalRow].number;

  // Expect filename to be in 's1234 Name of Province.xlsx' format
  const filename = path.basename(file);
  const delimiterIndex = filename.indexOf(" ");
  const name = filename.slice(delimiterIndex + 1, filename.length - 5);
  const sheetCode = filename.slice(1, delimiterIndex);

  const psgcCode = areaNameToCode(name);
  if (!psgcCode) {
    console.warn(
      `No code found for '${name}'. Falling back to sheet data: ${sheetCode}`
    );
  } else if (sheetCode !== psgcCode) {
    console.warn(
      `Mismatched code from sheet & from PSGC for '${name}'. Geojson: ${sheetCode}. PSGC: ${psgcCode}. PSGC used.`
    );
  }

  let code = psgcCode || sheetCode;

  // Merge areas. See MERGE_MAP
  if (MERGE_MAP[code]) {
    console.log(`Merging ${name} (${code}) → ${MERGE_MAP[code]}`);
    code = MERGE_MAP[code];
  }

  let counts = {};

  let lastProcessedRow = totalRow + 1;

  for (let i = totalRow + 1; i < array.length; i++) {
    const row = array[i];
    lastProcessedRow = i + 1;

    if (BLACKLIST.includes(row.language)) {
      continue;
    }

    // Detect end of main table (See 's1300 NCR.xlsx' for example)
    if (!row.number) {
      break;
    }

    // normalize; sometimes apostrophes render as '?'
    let language = row.language.toLocaleLowerCase().replace(/\?/g, "'");

    // Language can have multiple names (e.g., Bisaya/Binisaya)
    if (language.match(SYNONYM_DELIMITER)) {
      const names = language.split(SYNONYM_DELIMITER);
      addSynonyms(names);
      language = synonymMap.get(names[0]).values().next().value;
    }

    counts[language] = row.number;
    grandTotal += row.number;
  }

  if (countMap.has(code)) {
    console.log(`Merging multiple count tables for ${code}`);
    const existingCounts = countMap.get(code);
    for (const language of Object.keys(existingCounts)) {
      counts[language] = (counts[language] || 0) + existingCounts[language];
    }
  }

  countMap.set(code, counts);

  console.log(`Processed rows ${totalRow + 2}-${lastProcessedRow + 1}`);
}

function addSynonyms(names) {
  const existingName = names.find((name) => synonymMap.has(name));
  const set = existingName ? synonymMap.get(existingName) : new Set(names);
  names.forEach((name) => synonymMap.set(name, set.add(name)));
}

const synonyms = Object.fromEntries(
  [...synonymMap.entries()].map(([name, set]) => [
    name,
    set.values().next().value,
  ])
);

for (const [code, counts] of countMap.entries()) {
  // merge counts by synonyms
  for (const key of Object.keys(counts)) {
    const language = synonyms[key] || key;
    if (language !== key) {
      counts[language] = (counts[language] || 0) + counts[key];
      delete counts[key];
    }
  }

  // rename
  const renameMap = LANGUAGE_LOCALISED_RENAME[code];
  if (renameMap) {
    for (const language of Object.keys(counts)) {
      for (let [from, to] of Object.entries(renameMap)) {
        from = synonyms[from] || from;
        if (language === from) {
          to = synonyms[to] || to;
          console.log(`Renaming "${from}" to "${to}" in ${code}`);
          counts[to] = counts[language];
          delete counts[from];
        }
      }
    }
  }

  // transfer
  const transferMap = FORCE_TRANSFER_HOUSEHOLDS[code];
  if (transferMap) {
    for (const language of Object.keys(counts)) {
      for (let [from, to] of Object.entries(transferMap)) {
        from = synonyms[from] || from;
        if (language === from) {
          let total = 0;
          for (let [toLanguage, value] of Object.entries(to)) {
            toLanguage = synonyms[toLanguage] || toLanguage;
            console.log(
              `Transferring ${value} from "${from}" to "${toLanguage}" in ${code}`
            );
            counts[toLanguage] = (counts[toLanguage] || 0) + value;
            console.log(
              `${toLanguage} in ${code} now at ${counts[toLanguage]}`
            );
            total += value;
          }
          counts[from] -= total;
          console.log(`${from} in ${code} now at ${counts[from]}`);
        }
      }
    }
  }

  // normalize count to proportion of total
  for (const language of Object.keys(counts)) {
    counts[language] =
      Math.round((counts[language] * 1e4 * 1e4) / grandTotal) / 1e4;
  }
}

const tentativeTotals = [...countMap.entries()].reduce(
  (acc, [code, counts]) => {
    // area total
    acc[code] =
      (acc[code] || 0) +
      Object.values(counts).reduce((acc2, count) => acc2 + count, 0);

    // language total
    for (const [language, count] of Object.entries(counts)) {
      acc[language] = (acc[language] || 0) + count;
    }

    return acc;
  },
  {}
);

// find main province of each language
const mainArea = new Map();
[...countMap.values()]
  .map((counts) => Object.keys(counts))
  .flatMap((languages) => languages) // .flatten()
  .filter((v, i, a) => a.indexOf(v) === i) // .unique()
  .forEach((language) => {
    let topAreaCode;
    let topAreaCount = 0;
    for (const [code, counts] of countMap.entries()) {
      const count = (counts[language] || 0) / tentativeTotals[code];
      if (count > topAreaCount) {
        topAreaCount = count;
        topAreaCode = code;
      }
    }
    mainArea.set(language, topAreaCode);
  });

// remove small populations
for (const [code, counts] of countMap.entries()) {
  let deletedCount = 0;

  for (const [language, count] of Object.entries(counts)) {
    if (mainArea.get(language) === code) {
      continue;
    }

    const p = count / tentativeTotals[code];
    const q = count / tentativeTotals[language];

    if (p < MIN_PROPORTION_P && q < MIN_PROPORTION_Q) {
      deletedCount += count;
      delete counts[language];
    }
  }

  if (deletedCount) {
    counts["_others"] = deletedCount;
  }
}

// recount totals
const totals = [...countMap.entries()].reduce((acc, [code, counts]) => {
  // area total
  acc[code] =
    (acc[code] || 0) +
    Object.values(counts).reduce((acc2, count) => acc2 + count, 0);

  // language total
  for (const [language, count] of Object.entries(counts)) {
    acc[language] = (acc[language] || 0) + count;
  }

  return acc;
}, {});

// add to master list
const list = new Set();
for (const counts of countMap.values()) {
  for (const language of Object.keys(counts)) {
    list.add(language);
  }
}

const data = {
  grandTotal,
  list: Array.from(list).filter((name) => name !== "_others"),
  synonyms,
  proportions: Object.fromEntries(countMap),
  totals,
};

console.log("Processed total of " + data.grandTotal + " units.");
console.log("Total: " + Object.keys(data.proportions).length + " areas.");

const outFile = path.resolve(__dirname, "data", "languages.json");
fs.writeFileSync(outFile, JSON.stringify(data));
console.log("Wrote output to " + outFile);
