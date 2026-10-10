import { InvalidLetterError } from "./invalid-letter-error.js";
import { InvalidSyllabicationError } from "./invalid-syllabication-error.js";

/**
 * syllabicate("oo at hindi") => ["u", "u", " ", "a", "t", " ", "hi", "n", "di"]
 *
 * @param {{
 *   simple?: boolean,
 *   separateRa?: boolean,
 *   precolonial?: boolean,
 * }} [how={}]
 *
 * @returns {{
 *   baybayinUnits: string[],
 *   transformed?: {
 *     fromWord: string,
 *     toWord: string,
 *     transforms: {
 *       type: "special" | "repetition" | "vowel" | "drop" | "cluster" | "ra",
 *       from: string,
 *       to: string,
 *     }[],
 *   }[],
 * }}
 */
export function syllabicate(phrase, how = {}) {
  phrase = phrase
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/gu, " ")
    .replace(/[^a-z\p{Letter}\s]|\p{Symbol}/gu, "-");

  if (!phrase.match(/[a-z]/)) {
    return { baybayinUnits: [] };
  }

  const invalidChars = [];
  const transformed = [];

  const words = phrase.split(/\s+/g).filter((word) => word);
  const baybayinUnits = words.flatMap((word, wordIndex) => {
    const wordBoundary = wordIndex > 0 ? [" "] : [];
    const fromWord = word;
    const transforms = [];

    if (!how?.simple) {
      const specialWord = syllabicateSpecial(word);
      if (specialWord) {
        const toWord = specialWord.join("");
        transformed.push({
          fromWord,
          toWord,
          transforms: [{ type: "special", from: fromWord, to: toWord }],
        });
        return [...wordBoundary, ...specialWord];
      }

      // remove repetition
      word = word.replace(
        /(ng|(?<!n)g|[^aeioug])\1+/g,
        (repetition, repeated) => {
          transforms.push({
            type: "repetition",
            from: repetition,
            to: repeated,
          });
          return repeated;
        },
      );
    }

    const baybayinUnits = [];
    let currentUnit = "";
    let unitTransforms = [];

    for (let letter of word) {
      letter = letter.toLowerCase();
      const lastLetter = currentUnit && currentUnit.slice(-1);

      if (isVowel(letter)) {
        if (letter === "e") {
          unitTransforms.push({ type: "vowel", from: currentUnit + "e" });
          letter = "i";
        }
        if (letter === "o") {
          unitTransforms.push({ type: "vowel", from: currentUnit + "o" });
          letter = "u";
        }

        currentUnit += letter;

        if (how?.precolonial) {
          const collapsedUnit = collapseConsonant(
            currentUnit,
            baybayinUnits.length === 0,
          );
          if (collapsedUnit !== currentUnit) {
            unitTransforms.push({ type: "drop", from: currentUnit });
            currentUnit = collapsedUnit;
          }
        }

        commitUnit(currentUnit);
      } else if (isConsonant(letter)) {
        if (
          currentUnit &&
          isConsonant(lastLetter) &&
          !(lastLetter === "n" && letter === "g")
        ) {
          if (how?.precolonial) {
            if (baybayinUnits.length === 0 || "wy".includes(letter)) {
              const collapsedUnit =
                collapseConsonant(currentUnit, true) +
                (letter === "w" ? "u" : "i");
              unitTransforms.push({
                type:
                  collapsedUnit.at(-1) === currentUnit.at(-1)
                    ? "drop"
                    : "cluster",
                from: currentUnit,
              });
              commitUnit(collapsedUnit);
            } else {
              unitTransforms.push({ type: "drop", from: currentUnit });
              commitUnit("");
            }
          } else {
            commitUnit(currentUnit);
          }
        }

        currentUnit += letter;
      } else if (letter === "-") {
        if (how?.precolonial) {
          unitTransforms.push({ type: "drop", from: currentUnit });
          commitUnit("");
        } else {
          commitUnit(currentUnit);
        }
      } else {
        invalidChars.push(letter);
      }
    }

    if (invalidChars.length > 0) {
      throw new InvalidLetterError(invalidChars);
    }

    if (currentUnit) {
      if (how?.precolonial) {
        unitTransforms.push({ type: "drop", from: currentUnit });
        commitUnit("");
      } else {
        commitUnit(currentUnit);
      }
    }

    if (baybayinUnits.length === 0) {
      throw new InvalidSyllabicationError(word);
    }

    if (transforms.length) {
      const toWord = baybayinUnits.join("");
      transformed.push({ fromWord, toWord, transforms });
    }

    return [...wordBoundary, ...baybayinUnits];

    function commitUnit(unit) {
      if (!how?.separateRa && unit.startsWith("r")) {
        unitTransforms.push({ type: "ra", from: unit });
        unit = "d" + unit.slice(1);
      }
      if (unit) {
        baybayinUnits.push(unit);
      }
      for (const unitTransform of unitTransforms) {
        transforms.push({ ...unitTransform, to: unit });
      }
      unitTransforms = [];
      currentUnit = "";
    }
  });

  if (transformed.length === 0) return { baybayinUnits };
  return { baybayinUnits, transformed };
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

// pi [sngi] => pi [ngi]
// ba [nta] => ba [ta]
// ko [mpyu] ter => ko [pu] te
function collapseConsonant(candidate, initial) {
  const vowel = candidate.match(/[aeiou]$/)?.[0] || "";
  const clusters = candidate
    .replace(/[aeiou]/g, "")
    .split(/([ptkbd]|(?<!n)g)/) // split by airflow stop
    .map((g) => g.split(/(ng|n(?!g)|[^aeioun])/g).filter((c) => c));
  if (!clusters.length) {
    return vowel;
  } else {
    let last = "";
    let stop = "";
    let next = "";
    for (let i = 0; i < clusters.length; i++) {
      const g = clusters[i];
      if (i % 2 === 0) {
        // non-stop cluster
        last = next;
        next = g.at(-1) || "";
      } else {
        // stop cluster
        stop = g.at(-1) || "";
      }
    }
    if (initial) return (last || stop || next) + vowel;
    return (clusters.length > 3 || last ? stop : next || stop) + vowel;
  }
}
