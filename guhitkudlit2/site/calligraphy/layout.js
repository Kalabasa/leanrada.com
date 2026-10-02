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
  const maxXByRow = [];

  for (let i = 0; i < layout.length; i++) {
    const g = layout[i];

    for (const v of g.map.flat()) {
      if (v) v.x *= g.xScale;
    }

    let offset = 0;
    if (opts.kern) {
      for (const [y, leftX] of findLeftXByRow(g)) {
        const maxX = maxXByRow[y];
        if (maxX !== undefined) {
          offset = Math.max(offset, maxX + 1 - leftX);
        }
      }
    } else {
      for (const maxX of maxXByRow) {
        if (maxX !== undefined) {
          offset = Math.max(offset, maxX + 1);
        }
      }
    }

    for (const v of g.map.flat()) {
      if (!v) continue;
      v.x += offset;
      maxXByRow[v.y] = Math.max(maxXByRow[v.y] ?? -Infinity, v.x);
    }
  }

  return layout;
}

function findLeftXByRow(glyph) {
  const leftXs = new Map();
  for (const v of glyph.map.flat()) {
    if (v) leftXs.set(v.y, Math.min(leftXs.get(v.y) ?? Infinity, v.x));
  }
  return leftXs;
}
