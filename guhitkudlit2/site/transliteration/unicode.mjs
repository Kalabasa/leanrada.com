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
  const normalizedUnicode = unicode
    .replaceAll("᜔", "᜕")
    .replaceAll("᜴", "᜕")
    .replaceAll("ᜟ", "ᜍ")
    .replace(/\s+(?=[᜵᜶])/g, "");
  let romanized = "";
  let i = 0;
  while (i < normalizedUnicode.length) {
    const pair = normalizedUnicode.slice(i, i + 2);
    if (unicodeToRomanized.has(pair)) {
      romanized += unicodeToRomanized.get(pair);
      i += 2;
    } else {
      const char = normalizedUnicode[i];
      romanized += unicodeToRomanized.get(char) ?? char;
      i += 1;
    }
  }
  return romanized.replace(/u(?=[bkdghlmnprstwy]*\b)/g, "o");
}
