import { baybayin } from "./baybay.mjs";

export function baybayinAngIngles(ingles) {
  ingles = ingles.toLowerCase()
    .replace(/tia/g, "tya")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/e[ei]/g, "i")
    .replace(/ie/g, "i")
    .replace(/(?<=[aeiou].*)ey$/, "i")
    .replace(/(?<=[^aeiou])a([^aeiou]*)e$/, "ey$1")
    .replace(/(?<=[^aeiou])y([^aeiou]*)e$/, "ay$1")
    .replace(/(?<=[^aeiou])[ie]([^aeiou]*)e$/, "i$1")
    .replace(/(?<=[^aeiou])o([^aeiou]*)e$/, "ow$1")
    .replace(/(?<=[^aeiou])u([^aeiou]*)e$/, "yu$1")
    .replace(/sh(?=[aeiou])/g, "sy")
    .replace(/sh/g, "s")
    .replace(/ph/g, "p")
    .replace(/^x/, "s")
    .replace(/c/g, "k")
    .replace(/q/g, "k")
    .replace(/f/g, "p")
    .replace(/v/g, "b")
    .replace(/z/g, "s")
    .replace(/x/g, "ks")
    .replace(/j/g, "dy")
    .replace(/h(?![aeiou])/g, "")
    .replace(/([^aeiou])\1+/g, "$1")
    .replace(/y$/, "i")
    .replace(/w$/, "u")
    .replace(/e$/, "");
  return baybayin(ingles, { payak: true });
}
