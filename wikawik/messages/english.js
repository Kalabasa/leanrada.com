setMessages("english", {
  bcp47: () => "en",
  logoSrc: () => "logo",
  searchPhrases: () => "Search for phrases…",
  nTranslations: (n) => `${n} translations`,
  source: () => "Sources:",
  inBaybayinScript: () => "In Baybayin script",
  translationListLabel: () => "Translation into other languages",
  areaInfoLabel: () => "About the locality",
  languageInfoLabel: () => "About the language",
  languageVitality: () => "Linguistic vitality",
  fromWikipedia: () => "Excerpt from Wikipedia",
  vitalityExtinct: () => "Extinct",
  vitalityEndangered: () => "Endangered",
  vitalitySafe: () => "Safe",
  vitalityCodeExtinct: () => "EX",
  vitalityCodeCriticallyEndangered: () => "CR",
  vitalityCodeSeverelyEndangered: () => "SE",
  vitalityCodeDefinitelyEndangered: () => "EN",
  vitalityCodeVulnerable: () => "VU",
  vitalityCodeSafe: () => "SA",
  vitalityNameExtinct: () => "Extinct",
  vitalityNameCriticallyEndangered: () => "Critically endangered",
  vitalityNameSeverelyEndangered: () => "Severely endangered",
  vitalityNameDefinitelyEndangered: () => "Definitely endangered",
  vitalityNameVulnerable: () => "VU",
  vitalityNameSafe: () => "SA",
  vitalityDescriptionExtinct: () =>
    "<strong>Extinct</strong> – There are no speakers left.",
  vitalityDescriptionCriticallyEndangered: () =>
    "<strong>Critically endangered</strong> – The only speakers of this language left are the great-grandparents, but they often do not use it because there may not be anyone else to speak it with.",
  vitalityDescriptionSeverelyEndangered: () =>
    "<strong>Severely endangered</strong> – The language is spoken only by grandparents and older. While the parent generation may understand it, they do not speak it to children. Parents are not passing their mother tongue to the next generation.",
  vitalityDescriptionDefinitelyEndangered: () =>
    "<strong>Definitely endangered</strong> – Children no longer speak the language as their mother tongue. The language is mostly used by parents and older.",
  vitalityDescriptionVulnerable: () =>
    "<strong>Vulnerable</strong> – The language is spoken by most children, but often only at home or in other particular social settings. Otherwise, they use the dominant language which is usually English or Tagalog.",
  vitalityDescriptionSafe: () =>
    "<strong>Safe</strong> – The language is spoken by all ages, from children to great-grandparents. There is no sign of being usurped by other dominant languages. The language is being inherited from one generation to the next.",
  languageCode: () => "ISO code",
  languageDescription: () => "Summary",
  localLanguages: () => "Local languages",
  languageCompared: (language, place) =>
    `${language} and other languages in ${place}`,
  languagesInPlace: (place) => `The languages in ${place}`,
  primaryLanguageDescription: (language, numerator, denominator, place) =>
    numerator === 0
      ? `Only a small minority in <strong>${place}</strong> speak <strong>${language}</strong> as their primary language at home.`
      : (numerator === denominator
          ? "Almost all"
          : numerator === 1 && denominator === 2
          ? "Almost half of all"
          : `About <strong>${numerator} in every ${denominator}</strong>`) +
        ` families in <strong>${place}</strong> speak${
          numerator === 1 ? "s" : ""
        } <strong>${language}</strong> as their primary language at home.`,
  others: () => "Others",
  readMore: () => "Read more",
  mediaSectionLabel: () => "Related media",
  sendFeedback: () => "Feedback",
  contribute: () => "Contribute translations",
});
