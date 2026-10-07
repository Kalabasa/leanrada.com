/**
 * @typedef {import("./glyphs.js").Glyph} Glyph
 */

// Layout works on a 2x grid relative to glyph coords
// to account for edges between vertices.
// If glyphs have 5 rows, layout has 9 rows
const layoutRows = 9;

/**
 * @param {Glyph[]} glyphs
 * @param {{
 *   alterStems?: boolean,
 *   kern?: boolean,
 *   gap?: number,
 * }} [opts]
 * @returns {Glyph[]}
 */
export function layoutLine(glyphs, opts = {}) {
  const layout = glyphs.map((g) => structuredClone(g));
  const gap = opts.gap ?? 1;

  // keep track of the max X laid per row to determine next placement
  const maxX = Array(layoutRows).fill(-Infinity);

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
      for (let row = 0; row < layoutRows; row++) {
        const extent = extents[row];
        offset = Math.max(offset, maxX[row] - extent.minX);
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

    for (let row = 0; row < layoutRows; row++) {
      maxX[row] = Math.max(maxX[row], extents[row].maxX + offset);
    }
  }

  return layout;
}

/**
 * @param {Glyph} glyph
 * @returns {{ minX: number, maxX: number }[]}
 */
function calculateExtents(glyph, gap) {
  const extents = Array.from({ length: layoutRows }, () => ({
    minX: Infinity,
    maxX: -Infinity,
  }));

  for (const glyphRow of glyph.map) {
    for (const vertex of glyphRow) {
      if (!vertex) continue;

      const vertexRow = Math.round(vertex.y * 2);
      extents[vertexRow].minX = Math.min(
        extents[vertexRow].minX,
        vertex.x - gap,
      );
      extents[vertexRow].maxX = Math.max(
        extents[vertexRow].maxX,
        vertex.x + gap,
      );

      for (const [neighbor, edge] of vertex.adjacency) {
        const endRow = Math.round(neighbor.y * 2);
        for (let row = vertexRow + 1; row < endRow; row++) {
          const progress = (row - vertexRow) / (endRow - vertexRow);
          const x = vertex.x + (neighbor.x - vertex.x) * progress;
          let minX = x - gap;
          let maxX = x + gap;
          if (edge.type === "leftCurve") minX -= 1;
          if (edge.type === "rightCurve") maxX += 1;
          extents[row].minX = Math.min(extents[row].minX, minX);
          extents[row].maxX = Math.max(extents[row].maxX, maxX);
        }
      }
    }
  }

  const min = Math.min(...extents.map((e) => e.minX));
  const max = Math.max(...extents.map((e) => e.maxX));
  for (let e of extents) {
    e.minX = Math.min(e.minX, min + 1);
    e.maxX = Math.max(e.maxX, max - 1);
  }

  return extents;
}
