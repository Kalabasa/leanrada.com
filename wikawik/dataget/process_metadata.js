const path = require("path");
const fs = require("fs");
const wiki = require("wikijs").default;
const cldrSegmentation = require("cldr-segmentation");
const stopword = require("stopword");
const { psgcData } = require("./common");

const languages = require("./data/languages.json");
const kwf = require("./data/kwf.json");

// Hardcode Wikipedia pages
const PAGE_TITLES = {
  fookien: "Philippine Hokkien",
  capizeño: "Capiznon language",
  ["t'boli"]: "Tboli language",
  finontok: "Bontoc language",
  tagbanwa: "Aborlan Tagbanwa language",
  surigawnon: "Surigaonon language",
  "iraya mangyan": "Iraya language",
  ata: "Ata language (Negros)",
  "hatang kayi": "Remontado Agta language",
  dupaningan: "Dupaningan Agta",
  "illanen manobo": "Ilianen language",
  "mag-antsi": "Antsi language",
  binatak: "Batak people (Philippines)", // No language article
  bugkalot: "Ilongot language",
  iwak: "Iwaak language",
  "iriga agta": "Mount Iriga Agta language",
  eskaya: "Eskayan language",
  "saranggani manobo": "Sarangani language",
  "pala'wan": "Palawano langauge",
  umirey: "Umiray Dumaget language",
  "1300": "Metro Manila",
  "1247": "Cotabato",
  "1263": "South Cotabato",
};

// There are no Wikipedia pages about these languages.
const NO_PAGE = [
  "binatak",
  "direrayaan",
  "magkonana",
  "tigwahanon", // included as "divergent dialect" of Matigsalug
  "dibabawon", // included as "divergent dialect" of Agusan Manobo
  "aromanen",
  "bangon",
  "palawani",
];

// Manually correct outdated or incorrect scraped information
// KWF data seems outdated or outright incorrect
const FORCE_METADATA = {
  // kapampangan: {
  // ??? https://iyil.ph/articles/kapamp%C3%A1ngan-language-is-definitely-endangered-unesco/
  //   vitality: "definitely_endangered",
  // },
  // Missing from KWF data http://kwf.gov.ph/mga-wika-ng-filipinas/ hanapin: "tawbuwid"
  taubuid: {
    vitality: "definitely_endangered",
  },
  ambala: {
    // https://www.ethnologue.com/size-and-vitality/abc
    vitality: "severely_endangered",
  },
  dupaningan: {
    // https://en.wikipedia.org/wiki/Languages_of_the_Philippines#2010_UNESCO_designation
    vitality: "vulnerable",
  },
  pannon: {
    // https://en.wikipedia.org/wiki/Languages_of_the_Philippines#2010_UNESCO_designation
    vitality: "vulnerable",
  },
  manide: {
    // https://en.wikipedia.org/wiki/Languages_of_the_Philippines#2010_UNESCO_designation
    vitality: "severely_endangered",
  },
  "isarog agta": {
    // https://en.wikipedia.org/wiki/Languages_of_the_Philippines#2010_UNESCO_designation
    vitality: "critically_endangered",
  },
};

// Good topics to look for in the Wikipedia article.
const DESCRIPTION_GOOD_WORDS = [
  "language",
  "languages",
  "dialect",
  "dialects",
  "lingua", // as in "lingua franca"
  "spoken",
  "linguistic",
];
// Language names are good indicators too, but not as much, because they can also be used to refer to the peoples.
const DESCRIPTION_LANGUAGE_WORDS = languages.list;
// Language facts are usually dumped into a Demographics section, which includes these unwanted topics.
const DESCRIPTION_BAD_WORDS = ["population", "density"];
// For sentence flow, remove connector words from the beginning of paragraphs
const REMOVE_SENTENCE_PREFIXES = ["thus, ", "on the other hand, "];

// Replace general statements that are redundant
const PHRASE_REPLACEMENTS = {
  "is an Austronesian language": "is a language", // almost all languages here are Austronesian, no need to mention that every time
  "is an Austronesian regional language": "is a language",
  "is a Malayo-Polynesian language": "is a language", // almost all languages here are Austronesian, no need to mention that every time
  "a province in the Philippines": "a province", // all provinces here are in the Philippines
};

const languageTitleMap = Object.fromEntries(
  Object.entries(PAGE_TITLES).map(([language, title]) => [
    languages.synonyms[language] || language,
    title,
  ])
);

const areaCodeToName = psgcData
  .filter((row) => row.interlevel === "Prov" || row.code === "130000000")
  .reduce((acc, row) => {
    if (row.original !== "False") {
      const code = row.code.substring(0, 4);
      acc[code] = formatName(row.location);
    }
    return acc;
  }, {});

const wikiJSOptions = {
  apiUrl: "http://en.wikipedia.org/w/api.php",
  headers: {
    "User-Agent":
      "wikawikMetadataFetch/0 (https://github.com/Kalabasa/wikawik; lgmrada@gmail.com) wiki.js/6.0.1",
  },
};
const wikiObj = wiki(wikiJSOptions);

const metadataEntries = Promise.all([
  ...Object.entries(areaCodeToName).map(fetchAreaMetadataEntry),
  ...languages.list.map(fetchLanguageMetadataEntry),
]);

async function fetchAreaMetadataEntry([code, name]) {
  try {
    console.log(`Fetching metadata for ${name} (${code})...`);
    const query =
      PAGE_TITLES[code] || `province of ${name.replace(/\(.*?\)/g, "").trim()}`;

    const wikiPage = fetchWikiPage(query);
    const info = wikiPage.then((page) => page.fullInfo());
    const summary = wikiPage.then((page) => page.summary());
    const content = wikiPage.then((page) => page.content());

    const metadata = {};

    const officialName = await info
      .then((info) => info.general.officialName)
      .catch(errorReporter("name"));
    if (!officialName || officialName === "refn") {
      metadata.name = name;
    } else {
      metadata.name = officialName.replace(/\(.*?\)/g, "").trim();
    }

    metadata.simpleName =
      code === "1300" ? "NCR" : name.replace(/\(.*?\)/g, "").trim();

    // parse wikipedia article for language-related description
    /** @type {string[][]} */
    const languageParagraphs = (await content.catch(errorReporter("content")))
      // get all paragraphs in the article
      .flatMap((item) => [item, ...(item.items || [])])
      .map((item) => item.content)
      // select only paragraphs with good words
      .filter((content) => {
        const words = stopword.removeStopwords(
          cldrSegmentation.wordSplit(content)
        );
        const score = words.reduce(
          (acc, word) =>
            acc +
            (DESCRIPTION_GOOD_WORDS.includes(word.toLocaleLowerCase()) ? 1 : 0),
          0
        );
        return score / words.length > 0.05;
      })
      // remove sentences with bad topics from each paragraph
      .map((content) =>
        cldrSegmentation
          .sentenceSplit(content, cldrSegmentation.suppressions.en)
          .filter((sentence, i) => {
            // First sentence of paragraph is important
            if (i == 0) return true;

            const words = stopword.removeStopwords(
              cldrSegmentation.wordSplit(sentence)
            );
            const score = words.reduce(
              (acc, word) => (
                (word = word.toLocaleLowerCase()),
                acc +
                  (DESCRIPTION_GOOD_WORDS.includes(word) ? 1 : 0) +
                  (DESCRIPTION_LANGUAGE_WORDS.includes(word) ? 0.1 : 0) +
                  (DESCRIPTION_BAD_WORDS.includes(word) ? -1 : 0)
              ),
              0
            );
            return score / words.length > 0.05;
          })
          // remove awkward connector words
          .map((sentence) => {
            for (const prefix of REMOVE_SENTENCE_PREFIXES) {
              if (sentence.toLocaleLowerCase().startsWith(prefix)) {
                sentence = sentence.slice(prefix.length);
                sentence =
                  sentence.slice(0, 1).toLocaleUpperCase() + sentence.slice(1);
              }
            }
            return sentence;
          })
      );

    const languageSentencesCount = languageParagraphs.reduce(
      (count, sentences) => count + sentences.length,
      0
    );

    const summaryContent = await summary.catch(errorReporter("summary"));

    // final description is a combination of the intro and the language-related paragraphs
    metadata.descriptionParagraphs = [
      cldrSegmentation
        .sentenceSplit(summaryContent, cldrSegmentation.suppressions.en)
        .map((sentence) => {
          for (const [find, replace] of Object.entries(PHRASE_REPLACEMENTS)) {
            sentence = sentence.replace(find, replace);
          }
          return sentence;
        })
        .slice(0, Math.max(1, 4 - languageSentencesCount)),
      ...languageParagraphs,
    ]
      .map(
        (paragraph) =>
          paragraph
            .map((sentence) => sentence.replace(/\s*?\(.*?\)/g, "").trim())
            .join(" ")
            .replace(/\.(?=\w)/g, ". ") // some periods get no space after them. quick fix
            .replace(/\s+/g, " ") // condense extra space
      )
      .filter((s) => s.length);

    metadata.sources = [(await wikiPage).url()];

    console.log(`Done fetching metadata for ${name} (${code})`);
    return [code, metadata];
  } catch (error) {
    console.error(`Error fetching metadata for ${name}`);
    console.error("  Error: " + error);
  }
}

async function fetchLanguageMetadataEntry(language) {
  try {
    console.log(`Fetching metadata for ${language}...`);
    const query = languageTitleMap[language] || `${language} language`;

    const metadata = {
      name: formatName(language),
      sources: [],
    };

    const kwfInfo = kwf.find(
      (item) =>
        languages.synonyms[item.name] === language ||
        item.alts.some((alt) => {
          return languages.synonyms[alt] === language;
        })
    );

    const noWikiPage = NO_PAGE.some(
      (l) => (languages.synonyms[l] || l) === language
    );

    if (!kwfInfo && noWikiPage) {
      return undefined;
    }

    if (kwfInfo) {
      metadata.vitality = kwfInfo.vitality;
      metadata.sources.push("https://kwf.gov.ph/mga-wika-ng-filipinas/");
    }

    if (!noWikiPage) {
      const wikiPage = fetchWikiPage(query);
      const summary = wikiPage.then((page) => page.summary());
      const info = wikiPage.then((page) => page.fullInfo());

      const summaryContent = await summary.catch(errorReporter("summary"));

      description = summaryContent
        .replace(/\s*?\(.*?\)/g, "")
        .replace(/\.(?=\w)/g, ". ") // some periods get no space after them. quick fix
        .replace(/\s+/g, " "); // condense extra space
      for (const [find, replace] of Object.entries(PHRASE_REPLACEMENTS)) {
        description = description.replace(find, replace);
      }
      metadata.description = description;
      metadata.tag = (await info).general.iso3 || null;
      metadata.sources.push((await wikiPage).url());
    }

    console.log(`Done fetching metadata for ${language}`);
    return [language, metadata];
  } catch (error) {
    console.error(`Error fetching metadata for ${language}`);
    console.error("  Error: " + error);
  }
}

function fetchWikiPage(query) {
  return wikiObj.page(query).catch(() => wikiObj.find(query));
}

function formatName(name) {
  name = name.toLocaleLowerCase();
  let index = 0;
  while (index >= 0) {
    name =
      name.slice(0, index) +
      name.slice(index, index + 1).toLocaleUpperCase() +
      name.slice(index + 1);
    const nextSpace = name.indexOf(" ", index + 1);
    if (nextSpace >= 0) {
      index = nextSpace + 1;
    } else {
      break;
    }
  }
  return name;
}

function errorReporter(fieldName) {
  return (reason) => {
    console.warn(`Error while fetching ${fieldName}`);
    throw reason;
  };
}

function forceMetadata(map) {
  for (let [key, value] of Object.entries(FORCE_METADATA)) {
    key = languages.synonyms[key] || key;
    deepAssign(map[key], value);
  }
}

function deepAssign(dst, src) {
  if (dst) {
    for (const [key, value] of Object.entries(src)) {
      if (typeof dst[key] === "object") {
        deepAssign(dst[key], value);
      } else {
        dst[key] = value;
      }
    }
  }
}

metadataEntries.then((entries) => {
  const map = Object.fromEntries(entries.filter((e) => e));

  forceMetadata(map);

  console.log(`Processed ${entries.length} items`);

  const outFile = path.resolve(__dirname, "data", "metadata.json");
  fs.writeFileSync(outFile, JSON.stringify(map));
  console.log("Wrote output to " + outFile);
});
