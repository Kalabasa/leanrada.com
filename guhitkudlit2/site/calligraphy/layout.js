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
  const occupiedCells = new Set();
  let cursor = 0;

  for (let i = 0; i < layout.length; i++) {
    const g = layout[i];

    let offset = cursor;
    if (opts.kern) {
      while (offset > 0 && !collides(g, offset - 1, occupiedCells)) {
        offset--;
      }
    }

    g.map.forEach(row =>
      row.forEach(v => {
        if (!v) return;
        v.x += offset;
        occupiedCells.add(cellKey(v.x, v.y));
      })
    );

    cursor = Math.max(cursor, offset + glyphWidth(g));
  }

  return layout;
}

function collides(glyph, offset, occupiedCells) {
  for (const v of glyph.map.flat()) {
    if (v && occupiedCells.has(cellKey(v.x + offset, v.y))) {
      return true;
    }
  }

  return false;
}

function cellKey(x, y) {
  return `${x},${y}`;
}

function glyphWidth(glyph) {
  return Math.max(...glyph.map.map(row => Math.max(...row.map((v, i) => v ? i + 1 : 0))));
}
