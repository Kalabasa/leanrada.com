import { baybayin } from "./baybay.mjs";

// Karaniwan
dapat(baybayin("aso")).ay(["a", "su"]);
dapat(baybayin("pusa")).ay(["pu", "sa"]);
dapat(baybayin("araw")).ay(["a", "da", "w"]);
dapat(baybayin("elepante")).ay(["i", "li", "pa", "n", "ti"]);
dapat(baybayin("bantay")).ay(["ba", "n", "ta", "y"]);
dapat(baybayin("daan")).ay(["da", "a", "n"]);
dapat(baybayin("doon")).ay(["du", "u", "n"]);
dapat(baybayin("biik")).ay(["bi", "i", "k"]);
dapat(baybayin("kailan")).ay(["ka", "i", "la", "n"]);
dapat(baybayin("baon")).ay(["ba", "u", "n"]);
dapat(baybayin("baul")).ay(["ba", "u", "l"]);
dapat(baybayin("kain")).ay(["ka", "i", "n"]);
dapat(baybayin("upuan")).ay(["u", "pu", "a", "n"]);

// Di normal na baybay
dapat(baybayin("tilapia")).ay(["ti", "la", "pi", "ya"]);
dapat(baybayin("durian")).ay(["du", "di", "ya", "n"]);

// Bigkas na iba sa baybay
dapat(baybayin("ng")).ay(["na", "ng"]);
dapat(baybayin("mga")).ay(["ma", "nga"]);
dapat(baybayin("ng",{ payak: true })).ay(["ng"]);

// Da at Ra
dapat(baybayin("suri")).ay(["su", "di"]);
dapat(baybayin("suri", { bukodAngRa: true })).ay(["su", "ri"]);
dapat(baybayin("durian", { bukodAngRa: true })).ay(["du", "ri", "ya", "n"]);

// Mga pangalan
const p = { ingles: true };
dapat(baybayin("Alfonso", p)).ay(["a", "l", "pu", "n", "su"]);
dapat(baybayin("Angela", p)).ay(["a", "n", "d", "yi", "la"]);
dapat(baybayin("Ashley", p)).ay(["a", "s", "li"]);
dapat(baybayin("Cane", p)).ay(["ki", "y", "n"]);
dapat(baybayin("Cesar", p)).ay(["si", "sa", "d"]);
dapat(baybayin("Christine", p)).ay(["k", "di", "s", "ti", "n"]);
dapat(baybayin("Christopher", p)).ay(["k", "di", "s", "tu", "pi", "d"]);
dapat(baybayin("Dane", p)).ay(["di", "y", "n"]);
dapat(baybayin("Dexter", p)).ay(["di", "k", "s", "ti", "d"]);
dapat(baybayin("Diane", p)).ay(["di", "ya", "n"]);
dapat(baybayin("Frederico", p)).ay(["p", "di", "di", "di", "ku"]);
dapat(baybayin("Gilbert", p)).ay(["gi", "l", "bi", "d", "t"]);
dapat(baybayin("Ian", p)).ay(["i", "ya", "n"]);
dapat(baybayin("Jenny", p)).ay(["d", "yi", "ni"]);
dapat(baybayin("John", p)).ay(["d", "ya", "n"]);
dapat(baybayin("Juan", p)).ay(["hu", "wa", "n"]);
dapat(baybayin("Keen", p)).ay(["ki", "n"]);
dapat(baybayin("Kenneth", p)).ay(["ki", "ni", "t"]);
dapat(baybayin("Lean", p)).ay(["li", "ya", "n"]);
dapat(baybayin("Leshrac", p)).ay(["li", "s", "da", "k"]);
dapat(baybayin("Mae", p)).ay(["mi", "y"]);
dapat(baybayin("Maria", p)).ay(["ma", "di", "ya"]);
dapat(baybayin("Michael", p)).ay(["ma", "y", "ki", "l"]);
dapat(baybayin("Paulo", p)).ay(["pa", "w", "lo"]);
dapat(baybayin("Philippines", p)).ay(["pi", "li", "pi", "n", "s"]);
dapat(baybayin("Quinn", p)).ay(["ku", "wi", "n"]);
dapat(baybayin("Rogelio", p)).ay(["du", "hi", "li", "yu"]);
dapat(baybayin("Roger", p)).ay(["du", "d", "yi", "d"]);
dapat(baybayin("Rose", p)).ay(["du", "w", "s"]);
dapat(baybayin("Ryle", p)).ay(["da", "y", "l"]);
dapat(baybayin("Sharon", p)).ay(["s", "ya", "du", "n"]);
dapat(baybayin("Stephanie", p)).ay(["s", "ti", "pa", "ni"]);
dapat(baybayin("Vanessa", p)).ay(["ba", "ni", "sa"]);
dapat(baybayin("Xian", p)).ay(["si", "ya", "n"]);
dapat(baybayin("Zenny", p)).ay(["si", "ni"]);
dapat(baybayin("Zoey", p)).ay(["su", "wi"]);

// ----------------------------------------------------------------------------

function dapat(bagay) {
  return {
    ay(inaasahan) {
      dapat.bilang = (dapat.bilang ?? 0) + 1;
      const pamilang = String(dapat.bilang).padStart(3, " ") + ". ";
      if (JSON.stringify(bagay) === JSON.stringify(inaasahan)) {
        console.error(`\x1b[32m${pamilang}Tama  : ${JSON.stringify(bagay)}\x1b[0m`);
      } else {
        console.error(`\x1b[31m${pamilang}Mali  : ${JSON.stringify(bagay)}\x1b[0m`);
        console.error(`\x1b[32m     Dapat : ${JSON.stringify(inaasahan)}\x1b[0m`);
      }
    }
  }
}
