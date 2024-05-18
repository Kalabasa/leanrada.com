const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const csvParse = require("csv-parse/lib/sync");

// As a developing country, Philippines's subdivisions constantly change. New cities and provinces get created all the time, so datasets and IDs across time don't quite match. We are working with PSGC from 2018, census from 2010, and geojson from 2015, and their entities don't match.
// For cleaner integration of data, we merge new entities into old ones. We don't care about administrative subdivisions for linguistic mapping purposes. New areas are merged into adjacent or enclosing areas.
// Also, there are cities at each level of subdivision. They are either merged or separated, depending on geography.
const MERGE_MAP = {
  // Isabela is a "province-level" city surrounded by Basilan.
  "0997": "1507", // City of Isabela -> Basilan.
  // Cotabato City is a "province-level" city surrounded by Maguindanao.
  "1298": "1538", // Cotabato City -> Maguindanao.
  // Davao Occidental is a new province (2013) extracted from Davao del Sur.
  "1186": "1124", // Davao Occidental -> Davao del Sur
  // Issue: Zamboanga City is really a separate area from Zamboanga del Sur, with Zamboanga Sibugay in between. Merge these three areas for continuity.
  "0983": "0973", // Zamboanga Sibugay -> Zamboangadel Sur
};

const psgc = csvParse(
  zlib.gunzipSync(
    fs.readFileSync(
      path.resolve(__dirname, "psgc/data/processed/clean-psgc.csv.gz")
    )
  ),
  { columns: true }
);

const areaNameToCodeMap = psgc
  .filter((row) => row.interlevel === "Prov" || row.location === "NCR")
  .reduce((acc, row) => {
    acc[normalizeName(row.location)] = row.code.substring(0, 4);
    return acc;
  }, {});

/**
 * @param {string} name;
 * @returns {string}
 */
function areaNameToCode(name) {
  return areaNameToCodeMap[normalizeName(name)];
}

/**
 * @param {string} name;
 * @returns {string}
 */
function normalizeName(name) {
  return name.toLocaleLowerCase().replace(/\W+/g, "");
}

module.exports = { psgcData: psgc, MERGE_MAP, areaNameToCode, normalizeName };
