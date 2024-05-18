const languages = require("./data/languages.json");
const topo = require("./data/areas.topo.json");
const phrases = require("./data/phrases.json");
const metadata = require("./data/metadata.json");

topo.objects.areas.geometries.forEach((geometry) => {
  const code = geometry.properties.wikaCode;
  if (!languages.proportions[code]) {
    console.error(`No languages for ${geometry.properties.wikaCode}`);
  }
  if (!metadata[code]) {
    console.error(`No metadata for ${geometry.properties.wikaCode}`);
  } else {
    if (!metadata[code].name) {
      console.error(`No metadata name for ${geometry.properties.wikaCode}`);
    }
    if (!metadata[code].simpleName) {
      console.error(
        `No metadata simpleName for ${geometry.properties.wikaCode}`
      );
    }
    if (!metadata[code].descriptionParagraphs) {
      console.error(
        `No metadata descriptionParagraphs for ${geometry.properties.wikaCode}`
      );
    }
    if (!metadata[code].sources) {
      console.error(`No metadata sources for ${geometry.properties.wikaCode}`);
    }
  }
});

languages.list.forEach((language) => {
  if (language === "undefined" || language === "null" || !language) {
    console.error(`Invalid language: ${language}`);
  }
  if (!metadata[language]) {
    console.error(`No metadata for ${language}`);
  } else {
    if (!metadata[language].name) {
      console.error(`No metadata name for ${language}`);
    }
    if (!metadata[language].code) {
      console.error(`No metadata code for ${language}`);
    }
    if (!metadata[language].vitality) {
      console.error(`No metadata vitality for ${language}`);
    }
    if (!metadata[language].description) {
      console.error(`No metadata description for ${language}`);
    }
    if (!metadata[language].sources) {
      console.error(`No metadata sources for ${language}`);
    }
  }
});

// TODO more checks

console.log("Done");
