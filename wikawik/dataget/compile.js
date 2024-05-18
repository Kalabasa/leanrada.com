const fs = require("fs");
const path = require("path");

const languages = require("./data/languages.json");
const topo = require("./data/areas.topo.json");
const phrases = require("./data/phrases.json");
const metadata = require("./data/metadata.json");
const media = require("./data/media.json");

const data = {
  phrases,
  metadata,
  languages: (({ proportions, totals }) => ({
    proportions,
    totals,
  }))(languages),
  topo,
  media,
};

const outFile = path.resolve(__dirname, "..", "viz", "data", "data.json");
fs.writeFileSync(outFile, JSON.stringify(data));
console.log("Wrote output to " + outFile);
