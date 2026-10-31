const tl = {
  bagongBersyon: () => `Ito ang lumang bersyon ng GuhitKudlit. <a href="/guhit-kudlit/">Subukan ang bagong GuhitKudlit!</a>`,
  pakilala: () => "Pansalin at panlikha ng kaligrapiyang baybayin 🖌️",
  tagalogNaSalita: () => "Tagalog na salita",
  tagalogBukodAngRa: () => "Tagalog (Magkabukod na 'da' at 'ra')",
  inglesNaSalitaEksperimental: () => "Ingles na salita (eksperimental)",
  pagkapantig: () => "Pagkapantig",
  lumikha: () => "·Lumikha·",
  diWastongLetra: (letra) => `'Di tiyak ang pagbaybay sa letrang: <em>${letra}</em>`,
  paliwanagNgDiWastongLetra: (halimbawa) => `<p>Walang kasingkatumbas sa baybayin ang nasabing letra.</p><p>Pwedeng isulat mo muna ito sa abakadang Tagalog. Halimbawa:</p><ul>${halimbawa}</ul><p>O kaya nama'y ilipat mo sa Ingles na input gamit ang pamalit (▾) sa taas:</p><blockquote><label>${salin.inglesNaSalitaEksperimental()}👉 ▾ 👈</label></blockquote>`,
  download: () => "Nenok",
  ginawaGamit: () => `Ginawa gamit ang GuhitKudlit`,
};

const en = {
  bagongBersyon: () => `This is the old version of GuhitKudlit. <a href="/guhit-kudlit/">Try the new GuhitKudlit!</a>`,
  pakilala: () => "Baybayin translator (transliterator) & calligraphy image generator 🖌️",
  tagalogNaSalita: () => "Tagalog word",
  tagalogBukodAngRa: () => "Tagalog (Distinct 'd' and 'r')",
  inglesNaSalitaEksperimental: () => "English word (experimental)",
  pagkapantig: () => "Syllabication",
  lumikha: () => "·Generate·",
  diWastongLetra: (letter) => `Can't unambiguously convert this letter: <em>${letter}</em>`,
  paliwanagNgDiWastongLetra: (example) => `<p>There is no direct baybayin equivalent for the said letter.</p><p>You can write it first in the Tagalog alphabet (abakada). For example:</p><ul>${example}</ul><p>Or switch to English input using the toggle (▾) above:</p><blockquote><label>${salin.inglesNaSalitaEksperimental()}👉 ▾ 👈</label></blockquote>`,
  download: () => "Download",
  ginawaGamit: () => `Made with GuhitKudlit`,
};

export const salin = typeof window !== "undefined" && /\btl\b/.test(window.location.search) ? tl : en;

export function isalinAngPahina() {
  for (const elemento of document.querySelectorAll("[data-salin]")) {
    elemento.innerHTML = salin[elemento.dataset.salin]();
  }
}
