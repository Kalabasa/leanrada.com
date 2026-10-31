import { baybayinAngIngles } from "./ingles.mjs";
import { DiWastongLetra } from "./mali.mjs";

/**
 * Baybayín ang binigay na `parirala` mula sa tinukoy na `wika`.
 * 
 * Ibabalik nito ay isang Array ng mga titik-baybayin, na naka-encode sa Latin.
 *   Kunwari, ang 'ᜃ' ay 'ka', 'ᜃᜒ' ay 'ki', at 'ᜃᜓ' ay 'ku'. Hindi ginagamit ang 'e' at 'o'.
 * 
 * Halimbawa,
 *   baybayin("oo at hindi") => ["u", "u", "a", "t", "hi", "n", "di"]
 * 
 * Possibleng ibahin kung `paano` ang pagbaybay: {
 *   payak?: boolean = Kung oo, hindi gagawin ang mga sadyang salita.
 *   ingles?: boolean = (Eksperimental) Kung oo, babasahin ang mga salita bilang Ingles.
 *   bukodAngRa?: boolean = Kung oo, hindi pag-iisahin ang 'd' at 'r'.
 * }
 */
export function baybayin(parirala, paano = {}) {
  parirala = parirala.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\P{Letter}|\p{Symbol}/u, " ");

  const diWastongLetra = [];

  const mgaSalita = parirala.split(/\s+/g);
  return mgaSalita.flatMap(salita => {
    if (!salita) return [];

    if (paano?.ingles) {
      return baybayinAngIngles(salita);
    }
    if (!paano?.payak) {
      const sinadya = baybayinKungSadyangSalita(salita);
      if (sinadya) return sinadya;

      // tanggalin ang pag-uulit
      salita = salita.replace(/(ng|(?<!n)g|[^aeioug])\1+/g, "$1");
    }

    let mgaTitik = []; // mga titik-baybayin
    let itongTitik = "";

    for (let letra of salita) {
      letra = letra.toLowerCase();
      const hulingTitik = itongTitik && itongTitik.slice(-1);
      if (patinig(letra)) {
        if (letra === "e") letra = "i";
        if (letra === "o") letra = "u";

        if (itongTitik && patinig(hulingTitik)) {
          mgaTitik.push(itongTitik);
          itongTitik = "";

          if (hulingTitik !== letra) {
            if ("ie".includes(hulingTitik)) {
              itongTitik = "y";
            }
          }
        }

        itongTitik += letra;
      } else if (katinigBakada(letra)) {
        if (itongTitik && !(hulingTitik === "n" && letra === "g")) {
          mgaTitik.push(itongTitik);
          itongTitik = "";
        }

        if (!paano?.bukodAngRa && letra === "r") {
          letra = "d";
        }

        itongTitik += letra;
      } else {
        diWastongLetra.push(letra);
      }
    }

    if (diWastongLetra.length > 0) {
      throw new DiWastongLetra(diWastongLetra);
    }

    if (itongTitik) {
      mgaTitik.push(itongTitik);
    }

    return mgaTitik;
  });
}

function patinig(letra) {
  return "aeiou".includes(letra);
}

function katinigBakada(letra) {
  return "bkdghlmnprstwy".includes(letra);
}

function baybayinKungSadyangSalita(salita) {
  if (salita === "ng") return ["na", "ng"];
  if (salita === "mga") return ["ma", "nga"];
  return null;
}
