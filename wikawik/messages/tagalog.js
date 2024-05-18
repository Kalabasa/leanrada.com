setMessages("tagalog", {
  bcp47: () => "tl",
  logoSrc: () => "logo_tagalog",
  searchPhrases: () => "Maghanap ng salita…",
  nTranslations: (n) => `${n} mga salin`,
  source: () => "Pinagbatayan:",
  inBaybayinScript: () => "Sa sulat Baybayin",
  translationListLabel: () => "Pagsasalin sa iba pang mga wika",
  areaInfoLabel: () => "Kaalaman sa lokalidad",
  languageInfoLabel: () => "Kaalaman sa wika",
  languageVitality: () => "Kalagayang panlinggwistika",
  fromWikipedia: () => "Sipi mula sa Wikipedia",
  vitalityExtinct: () => "Patay",
  vitalityEndangered: () => "Nanganganib",
  vitalitySafe: () => "Ligtas",
  vitalityCodeExtinct: () => "PA",
  vitalityCodeCriticallyEndangered: () => "LN",
  vitalityCodeSeverelyEndangered: () => "TN",
  vitalityCodeDefinitelyEndangered: () => "NA",
  vitalityCodeVulnerable: () => "DL",
  vitalityCodeSafe: () => "LI",
  vitalityNameExtinct: () => "Patay",
  vitalityNameCriticallyEndangered: () => "Lubhang nanganganib",
  vitalityNameSeverelyEndangered: () => "Matinding nanganganib",
  vitalityNameDefinitelyEndangered: () => "Tiyak na nanganganib",
  vitalityNameVulnerable: () => "Di ligtas",
  vitalityNameSafe: () => "Ligtas",
  vitalityDescriptionExtinct: () =>
    "<strong>Patay</strong> – Wala nang natirang nakapagsasalita ng wika na ito.",
  vitalityDescriptionCriticallyEndangered: () =>
    "<strong>Lubhang nanganganib</strong> – Ang tanging mga nakapagsasalita ng wikang ito ay ang mga kanuno-nunuan na lamang. Hindi na rin nila ito madalas magamit marahil ay dahil wala nang ibang makakausap sa wikang ito.",
  vitalityDescriptionSeverelyEndangered: () =>
    "<strong>Matinding nanganganib</strong> – Mga lolo-lola na lamang ang nagsasalita ng wikang ito . Bagama’t marunong pa rin ang mga magulang sa wikang ito, hindi na nila ito ginagamit sa pakikipag-usap sa kanilang mga anak. Hindi na naipapasa ng mga magulang ang kanilang wika sa kasunod na henerasyon.",
  vitalityDescriptionDefinitelyEndangered: () =>
    "<strong>Tiyak na nanganganib</strong> – Hindi na ito ang kinagigisnang wika ng mga kabataan. Halos mga magulang at nakatatanda na lamang ang gumagamit ng wikang ito.",
  vitalityDescriptionVulnerable: () =>
    "<strong>Di ligtas</strong> – Karamihan ng kabataan ay nagkapagsasalita ng wikang ito, pero ito’y kadalasang ginagamit lang sa kani-kanilang tahanan o di kaya’y sa mga partikular na sitwasyon lamang. Sa halip ay mas nananaig ang ibang lenggwahe, na karaniwan ay Ingles o Tagalog.",
  vitalityDescriptionSafe: () =>
    "<strong>Ligtas</strong> – Mula bata hanggang sa matatanda ay ginagamit ang wikang ito. Walang banta mula sa ibang mga nananaig na lenggwahe. Ang wika ay naipapamana sa mga sumusunod na henerasyon.",
  languageCode: () => "ISO code",
  languageDescription: () => "Buod",
  localLanguages: () => "Mga wikang lokal",
  languageCompared: (wika, lugar) => `${wika} at iba pang mga wika sa ${lugar}`,
  languagesInPlace: (lugar) => `Ang mga wika sa ${lugar}`,
  primaryLanguageDescription: (wika, numerator, denominator, lugar) =>
    numerator === 0
      ? `Maliit na minorya lamang ang nagsasalita ng <strong>${wika}</strong> sa <strong>${lugar}</strong> bilang panghunahing wika sa tahanan.`
      : (numerator === denominator
          ? "Halos lahat ng"
          : numerator === 1 && denominator === 2
          ? "Halos kalahati ng mga"
          : `Humigit-kumulang na <strong>${numerator} sa bawat ${denominator}</strong> ` +
            ([4, 6, 9].includes(denominator % 10) ? "na" : "")) +
        ` pamilya sa <strong>${lugar}</strong> ay nagsasalita ng <strong>${wika}</strong> bilang panghunahing wika sa tahanan.`,
  others: () => "IbaPa",
  readMore: () => "Magbasa pa",
  mediaSectionLabel: () => "Mga tunog at larawan sa naturang wika",
  sendFeedback: () => "Magbigay-puna",
  contribute: () => "Mag-ambag ng salin",
});
