/**
 * @typedef {import("./glyphs.js").Glyph} Glyph
 */

// Layout works on a 2x grid relative to glyph coords
// to account for edges between vertices.
// If glyphs have 3 rows, layout has 5 rows
const ROWS = 5;

/**
 * @param {Glyph[]} glyphs 
 * @param {{
 *   alterStems?: boolean,
 *   kern?: boolean,
 *   gap?: number,
 * }} [opts]
 * @returns {Glyph[]}
 */
export function layOut(glyphs, opts = {}) {
  const layout = glyphs.map(g => structuredClone(g));
  const gap = opts.gap ?? 0.5;

  // keep track of the max X laid per row to determine next placement
  const maxX = Array(ROWS).fill(-Infinity);

  for (let i = 0; i < layout.length; i++) {
    const glyph = layout[i];

    for (const row of glyph.map) {
      for (const v of row) {
        if (v) v.x *= glyph.xScale;
      }
    }

    const extents = calculateExtents(glyph, gap);

    let offset = 0;
    if (opts.kern) {
      for (let row = 0; row < ROWS; row++) {
        const extent = extents[row];
        offset = Math.max(offset, maxX[row] - extent.leftX);
      }
    } else {
      for (const rowMaxX of maxX) {
        offset = Math.max(offset, rowMaxX);
      }
    }

    for (const glyphRow of glyph.map) {
      for (const v of glyphRow) {
        if (v) v.x += offset;
      }
    }

    for (let row = 0; row < ROWS; row++) {
      maxX[row] = Math.max(maxX[row], extents[row].rightX + offset);
    }
  }

  return layout;
}

/**
 * @param {Glyph} glyph
 * @returns {{ leftX: number, rightX: number }[]}
 */
function calculateExtents(glyph, gap) {
  const extents = Array.from({ length: ROWS }, () => ({
    leftX: Infinity,
    rightX: -Infinity,
  }));

  for (const glyphRow of glyph.map) {
    for (const vertex of glyphRow) {
      if (!vertex) continue;

      const vertexRow = vertex.y * 2;
      extents[vertexRow].leftX = Math.min(extents[vertexRow].leftX, vertex.x - gap);
      extents[vertexRow].rightX = Math.max(extents[vertexRow].rightX, vertex.x + gap);

      for (const [neighbor, edge] of vertex.adjacency) {
        const endRow = neighbor.y * 2;
        for (let row = vertexRow + 1; row < endRow; row++) {
          const progress = (row - vertexRow) / (endRow - vertexRow);
          const x = vertex.x + (neighbor.x - vertex.x) * progress;
          let leftX = x - gap;
          let rightX = x + gap;
          if (edge.type === "leftCurve") leftX -= 1;
          if (edge.type === "rightCurve") rightX += 1;
          extents[row].leftX = Math.min(extents[row].leftX, leftX);
          extents[row].rightX = Math.max(extents[row].rightX, rightX);
        }
      }
    }
  }

  return extents;
}
