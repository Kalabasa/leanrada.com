const axios = require("axios").default;
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs");

const REMOVE_ALT = [
  "bisaya", // Too generic alternate name
  "mandaya", // Separate Mandaya & Davawenyo
  "agta", // Too generic
  "manobo", // Too generic
  "mangyan", // Too generic
  "abenlen", // Error in KWF's Tagabawa entry
  "aburlin", // Error in KWF's Tagabawa entry
  "ayta abellen", // Error in KWF's Tagabawa entry
];

const columnProps = {
  "Pangalan ng Wika": { name: "name", array: false },
  "Iba pang tawag sa wika (alternate names)": {
    name: "alts",
    array: true,
    conjuctor: ["o", "at"],
  },
  "Pangkat na gumagamit ng wika": { name: "people", array: false },
  "Sigla ng Wika": {
    name: "vitality",
    array: false,
    valueMap: {
      Ligtas: "safe",
      "Di-Ligtas": "vulnerable",
      "Di-ligtas": "vulnerable",
      Di_Ligtas: "vulnerable",
      Di_ligtas: "vulnerable",
      "Di-ligta": "vulnerable",
      Nanganganib: "definitely_endangered",
      "Nanganganib batay sa kumakaunting bilang ng Katutubo":
        "definitely_endangered",
      "Tiyak na Nanganganib": "definitely_endangered",
      "Tiyak na nanganganib": "definitely_endangered",
      "Matinding Nanganganib": "severely_endangered",
      "Matinding nanganganib": "severely_endangered",
      "Malubhang Nanganganib": "critically_endangered",
      "Malubhang nanganganib": "critically_endangered",
      [null]: undefined,
    },
  },
  Klasipikasyon: {
    name: "family",
    array: true,
  },
  "Mga kilalang wikain (dialects)": {
    name: "dialects",
    array: true,
    conjuctor: ["at"],
  },
  Populasyon: { name: "population", array: false },
  Lokasyon: { name: "location", array: false },
  "Sistema ng Pagsulat": { name: "script", array: false },
};

async function fetchData() {
  return axios
    .get("https://kwf.gov.ph/wp-json/wp/v2/pages?slug=wika")
    .then((response) => {
      const html = response.data[0].content.rendered;

      const chr = cheerio.load(html);
      const data = chr("table")
        .get()
        .map((tableEl) => {
          const table = chr(tableEl);
          return table
            .find("tr")
            .get()
            .map((trEl) => {
              const tr = chr(trEl);
              return tr
                .find("td")
                .get()
                .map((tdEl) => chr(tdEl).text().trim())
                .filter((text, i) => i !== 0 || text);
            });
        });

      return data;
    });
}

function convertToObject(datum) {
  return datum.reduce((acc, row) => {
    acc[row[0]] = row[1];
    return acc;
  }, {});
}

const languageEntries = fetchData().then((data) => {
  const objects = data.map(convertToObject);

  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      if (columnProps[key]) {
        const column = columnProps[key];

        let newVal = value;

        if (column.array) {
          if (column.conjuctor) {
            for (const conj of column.conjuctor) {
              newVal = newVal.replace(`, ${conj} `, "");
            }
          }
          newVal = newVal
            .split(/[,;]/g)
            .map((str) => {
              str = str.trim();
              if (column.valueMap) {
                str = valueMap(str, column.valueMap);
              }
              return str;
            })
            .filter((str) => str);
        } else {
          newVal = newVal.trim();
          if (column.valueMap) {
            newVal = valueMap(newVal, column.valueMap);
          }
        }

        delete obj[key];

        if (!isNone(newVal)) {
          obj[column.name] = newVal;
        }
      } else {
        if (isNone(value)) {
          delete obj[key];
          continue;
        }
      }
    }

    // normalize
    obj.name = normalizeKWFLanguageName(obj.name);

    if (obj.alts) {
      obj.alts = obj.alts
        // special sub-separator for alts (slash)
        .flatMap((str) => str.split("/"))
        .map((str) => str.trim())
        // normalize
        .map(normalizeKWFLanguageName)
        // filter alts
        .filter((str) => !REMOVE_ALT.includes(str));
    }
  }

  return objects;
});

function normalizeKWFLanguageName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase();
}

function valueMap(value, map) {
  const mapped = map[value];
  if (!mapped) {
    console.warn(
      `Unknown value ${value}. Expected: ${Object.keys(map).join(", ")}`
    );
  }
  return mapped || map[null];
}

function isNone(str) {
  return str === undefined || str === "-" || str === "Wala";
}

languageEntries.then((entries) => {
  console.log(`Processed ${entries.length} items`);

  const outFile = path.resolve(__dirname, "..", "data", "kwf.json");
  fs.writeFileSync(outFile, JSON.stringify(entries));
  console.log("Wrote output to " + outFile);
});
