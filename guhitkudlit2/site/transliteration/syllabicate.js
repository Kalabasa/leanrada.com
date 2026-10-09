import { InvalidLetterError } from "./invalid-letter-error.js";

/**
 * Transliterates the given `phrase` from the specified `language` into Baybayin.
 *
 * It returns an Array of Baybayin characters, romanized in Latin.
 *   For example, 'ᜃ' is 'ka', 'ᜃᜒ' is 'ki', and 'ᜃᜓ' is 'ku'. The letters 'e' and 'o' are not used.
 *
 * Example,
 *   syllabicate("oo at hindi") => ["u", "u", " ", "a", "t", " ", "hi", "n", "di"]
 *
 * There are options to modify `how` it transliterates: {
 *   simple?: boolean = If true, it will not handle special cases for specific words.
 *   separateRa?: boolean = If true, 'd' and 'r' will not be merged.
 * }
 * @param {{
 *   simple?: boolean,
 *   separateRa?: boolean,
 *   precolonial?: boolean,
 * }} [how={}]
 *
 * @returns {string[]}
 */
export function syllabicate(phrase, how = {}) {
  phrase = phrase
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\P{Letter}|\p{Symbol}/u, " ")
    .replace(/[^a-zA-Z]/g, " ");

  const invalidChars = [];

  const words = phrase.split(/\s+/g).filter((word) => word);
  return words.flatMap((word, wordIndex) => {
    const wordBoundary = wordIndex > 0 ? [" "] : [];

    if (!how?.simple) {
      const specialWord = syllabicateSpecial(word);
      if (specialWord) return [...wordBoundary, ...specialWord];

      // remove repetition
      word = word.replace(/(ng|(?<!n)g|[^aeioug])\1+/g, "$1");
    }

    let baybayinUnits = [];
    let currentUnit = "";

    for (let letter of word) {
      letter = letter.toLowerCase();
      const lastLetter = currentUnit && currentUnit.slice(-1);

      if (isVowel(letter)) {
        if (letter === "e") letter = "i";
        if (letter === "o") letter = "u";

        currentUnit += letter;

        if (how?.precolonial) {
          currentUnit = collapseConsonant(currentUnit);
        }

        baybayinUnits.push(currentUnit);
        currentUnit = "";
      } else if (isConsonant(letter)) {
        if (
          currentUnit &&
          isConsonant(lastLetter) &&
          !(lastLetter === "n" && letter === "g") &&
          !how?.precolonial
        ) {
          baybayinUnits.push(currentUnit);
          currentUnit = "";
        }

        currentUnit += letter;
      } else {
        invalidChars.push(letter);
      }
    }

    if (invalidChars.length > 0) {
      throw new InvalidLetterError(invalidChars);
    }

    if (currentUnit && !how?.precolonial) {
      baybayinUnits.push(currentUnit);
    }

    if (!how?.separateRa) {
      baybayinUnits = baybayinUnits.map((u) =>
        u.startsWith("r") ? "d" + u.slice(1) : u,
      );
    }

    return [...wordBoundary, ...baybayinUnits];
  });
}

/** @param {string[]|string} baybayin */
export function hasVirama(baybayin) {
  if (Array.isArray(baybayin)) {
    return baybayin.some((u) => hasVirama(u));
  } else {
    return baybayin.match(/[bkdghlmnprstwy]/) && !baybayin.match(/[aeiou]/);
  }
}

function isVowel(letter) {
  return "aeiou".includes(letter);
}

function isConsonant(letter) {
  return "bkdghlmnprstwy".includes(letter);
}

function syllabicateSpecial(word) {
  if (word === "ng") return ["na", "ng"];
  if (word === "mga") return ["ma", "nga"];
  return null;
}

// (pi)sngi => ngi
// pri(to) => pi
// (ba)nta => ta
function collapseConsonant(candidate) {
  const vowel = candidate.match(/[aeiou]$/)?.[0] ?? "";
  const consonants = candidate
    .replace(/[aeiou]/g, "")
    .split(/([ptkbdg]|ng)/g) // cluster by airflow stops
    .flatMap((c) => c.split(/(ng|n(?!g)|[^aeiou])/g))
    .filter((c) => c)
    .reverse();
  // generally, the first consonant after the last stop wins
  let consonant = "";
  for (const c of consonants) {
    consonant = c;
    if ("wy".includes(c)) continue;
    if (c === "ng" || "ptkbdg".includes(c)) break;
  }
  return consonant + vowel;
}
