/**
 * @typedef {import("./glyphs.js").Glyph} Glyph
 */

/**
 * @param {Glyph[]} glyphs 
 * @param {{
 *   alterStems?: boolean,
 *   kern?: boolean,
 * }} [opts]
 * @returns {Glyph[]}
 */
export function layOut(glyphs, opts = {}) {
  const layout = glyphs.map(g => structuredClone(g));
  let cursor = 0;
  for (let i = 0; i < layout.length; i++) {
    const g = layout[i];
    g.forEach(row =>
      row.forEach(v => {
        if (!v) return;
        v.x += cursor;
      })
    );
    cursor += glyphWidth(g);
  }
  return layout;
}

function glyphWidth(glyph) {
  return Math.max(...glyph.map(row => Math.max(...row.map((v, i) => v ? i + 1 : 0))));
}
