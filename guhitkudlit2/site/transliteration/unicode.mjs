const map = {
  a: "ᜀ",
  i: "ᜁ",
  u: "ᜂ",
  ba: "ᜊ",
  bi: "ᜊᜒ",
  bu: "ᜊᜓ",
  b: "ᜊ᜕",
  ka: "ᜃ",
  ki: "ᜃᜒ",
  ku: "ᜃᜓ",
  k: "ᜃ᜕",
  da: "ᜇ",
  di: "ᜇᜒ",
  du: "ᜇᜓ",
  d: "ᜇ᜕",
  ra: "ᜍ",
  ri: "ᜍᜒ",
  ru: "ᜍᜓ",
  r: "ᜍ᜕",
  ga: "ᜄ",
  gi: "ᜄᜒ",
  gu: "ᜄᜓ",
  g: "ᜄ᜕",
  ha: "ᜑ",
  hi: "ᜑᜒ",
  hu: "ᜑᜓ",
  h: "ᜑ᜕",
  la: "ᜎ",
  li: "ᜎᜒ",
  lu: "ᜎᜓ",
  l: "ᜎ᜕",
  ma: "ᜋ",
  mi: "ᜋᜒ",
  mu: "ᜋᜓ",
  m: "ᜋ᜕",
  na: "ᜈ",
  ni: "ᜈᜒ",
  nu: "ᜈᜓ",
  n: "ᜈ᜕",
  nga: "ᜅ",
  ngi: "ᜅᜒ",
  ngu: "ᜅᜓ",
  ng: "ᜅ᜕",
  pa: "ᜉ",
  pi: "ᜉᜒ",
  pu: "ᜉᜓ",
  p: "ᜉ᜕",
  sa: "ᜐ",
  si: "ᜐᜒ",
  su: "ᜐᜓ",
  s: "ᜐ᜕",
  ta: "ᜆ",
  ti: "ᜆᜒ",
  tu: "ᜆᜓ",
  t: "ᜆ᜕",
  wa: "ᜏ",
  wi: "ᜏᜒ",
  wu: "ᜏᜓ",
  w: "ᜏ᜕",
  ya: "ᜌ",
  yi: "ᜌᜒ",
  yu: "ᜌᜓ",
  y: "ᜌ᜕",
  " ": " ",
  ".": "᜶",
  ",": "᜵",
};

/**
 * @param {Array<keyof map>} romanizedBaybayinUnits
 * @param {"krus" | "pamudpod" | "precolonial"} viramaStyle
 */
export function convertToUnicode(romanizedBaybayinUnits, viramaStyle) {
  const unicode = romanizedBaybayinUnits.map((unit) => map[unit]).join("");
  if (viramaStyle === "krus") return unicode.replaceAll("᜕", "᜔");
  if (viramaStyle === "precolonial") return unicode.replaceAll("᜕", "");
  return unicode;
}

const unicodeToRomanized = new Map(
  Object.entries(map).map(([romanized, unicode]) => [unicode, romanized]),
);

/** @param {string} unicode */
export function convertFromUnicode(unicode) {
  const normalized = unicode
    .replaceAll("᜔", "᜕")
    .replaceAll("᜴", "᜕")
    .replaceAll("ᜟ", "ᜍ")
    .replace(/\s+(?=[᜵᜶])/g, "");

  let romanized = "";
  let i = 0;
  while (i < normalized.length) {
    const pair = normalized.slice(i, i + 2);
    if (unicodeToRomanized.has(pair)) {
      romanized += unicodeToRomanized.get(pair);
      i += 2;
    } else {
      const char = normalized[i];
      romanized += unicodeToRomanized.get(char) ?? char;
      i += 1;
    }
  }

  return resolveVowels(
    normalized.includes("ᜍ") ? romanized : resolveDR(romanized),
  );
}

function resolveVowels(romanized) {
  return (
    romanized
      // o/u: final syllable usually U instead of O
      .replace(/u(?=[bkdghlmnprstwy]*\b)/g, "o")
      // i/e: final syllable often E instead of I when after A
      .replace(/ai\b/g, "ae")
  );
}

function resolveDR(romanized) {
  return (
    romanized
      // daw/raw, dito/rito, etc
      .replace(/(?<=[aeiouwyd] )d(?=(?:aw|in|uun|itu|iyan)\b)/g, "r")
      // D between vowels becomes R
      .replace(/(?<=[aeiou])d(?=[aeiou])/g, (match, offset, text) => {
        const redupeFirst =
          text[offset - 2] === "d" && text[offset - 1] === text[offset + 1];
        const redupeSecond =
          text[offset + 2] === "d" && text[offset + 3] === text[offset + 1];
        const prefix =
          ["ma", "ka", "pa"].includes(text.slice(offset - 2, offset)) &&
          !/[a-z]/.test(text[offset - 3] ?? "");
        // except reduplication (dadalo) or ma-/ka-/pa- (madali)
        if (redupeFirst || redupeSecond || prefix) {
          return match;
        }
        return "r";
      })
  );
}
