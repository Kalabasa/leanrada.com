import { InvalidLetterError } from "./invalid-letter-error.js";

/**
 * Transliterates the given `phrase` from the specified `language` into Baybayin.
 *
 * It returns an Array of Baybayin characters, romanized in Latin.
 *   For example, 'ᜃ' is 'ka', 'ᜃᜒ' is 'ki', and 'ᜃᜓ' is 'ku'. The letters 'e' and 'o' are not used.
 *
 * Example,
 *   syllabicate("oo at hindi") => ["u", "u", "a", "t", "hi", "n", "di"]
 *
 * There are options to modify `how` it transliterates: {
 *   simple?: boolean = If true, it will not handle special cases for specific words.
 *   separateRa?: boolean = If true, 'd' and 'r' will not be merged.
 * }
 * @param {{
 *   simple?: boolean,
 *   separateRa?: boolean,
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

  const words = phrase.split(/\s+/g);
  return words.flatMap((word) => {
    if (!word) return [];

    if (!how?.simple) {
      const specialWord = syllabicateSpecial(word);
      if (specialWord) return specialWord;

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

        if (currentUnit && isVowel(lastLetter)) {
          baybayinUnits.push(currentUnit);
          currentUnit = "";
        }

        currentUnit += letter;
      } else if (isConsonant(letter)) {
        if (currentUnit && !(lastLetter === "n" && letter === "g")) {
          baybayinUnits.push(currentUnit);
          currentUnit = "";
        }

        if (!how?.separateRa && letter === "r") {
          letter = "d";
        }

        currentUnit += letter;
      } else {
        invalidChars.push(letter);
      }
    }

    if (invalidChars.length > 0) {
      throw new InvalidLetterError(invalidChars);
    }

    if (currentUnit) {
      baybayinUnits.push(currentUnit);
    }

    return baybayinUnits;
  });
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
