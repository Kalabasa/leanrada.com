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
 *   kern?: boolean,
 *   gap?: number,
 * }} [opts]
 * @returns {Glyph[]}
 */
export function layoutLine(glyphs, opts = {}) {
  const layout = glyphs.map((g) => structuredClone(g));
  const gap = opts.gap ?? 0.5;

  // keep track of the max X laid per row to determine next placement
  const maxX = Array(layoutRows).fill(0);

  for (let i = 0; i < layout.length; i++) {
    const glyph = layout[i];

    for (const row of glyph.map) {
      for (const v of row) {
        if (v) v.x *= glyph.xScale;
      }
    }

    const extents = calculateExtents(glyph, gap);

    let glyphX = 0;
    for (let row = 0; row < layoutRows; row++) {
      const kernOffset = opts.kern ? -extents[row].minX : 0;
      glyphX = Math.max(glyphX, maxX[row] + kernOffset);
    }

    for (const glyphRow of glyph.map) {
      for (const v of glyphRow) {
        if (v) v.x += glyphX;
      }
    }

    for (let row = 0; row < layoutRows; row++) {
      maxX[row] = Math.max(maxX[row], glyphX + extents[row].maxX);
    }
  }

  return layout;
}

/**
 * @param {string[]} baybayinUnits
 * @param {"normal" | "grid" | "diamond"} formation
 * @returns {string[][]}
 */
export function wrapLines(baybayinUnits, formation) {
  const lines = [[]];
  switch (formation) {
    case "normal":
      for (const unit of baybayinUnits) {
        if (unit === " ") {
          lines.push([]);
        } else {
          lines.at(-1).push(unit);
        }
      }
      break;
    case "grid":
      const gridUnits = baybayinUnits.filter((u) => u !== " ");
      const gridWidth = Math.round(Math.sqrt(gridUnits.length));
      for (const unit of gridUnits) {
        if (lines.at(-1).length >= gridWidth) {
          lines.push([]);
        }
        lines.at(-1).push(unit);
      }
      break;
    case "diamond":
      const diamondUnits = baybayinUnits.filter((u) => u !== " ");
      const diamondWidth = Math.ceil(Math.sqrt(diamondUnits.length));
      for (const unit of diamondUnits) {
        if (
          lines.at(-1).length >=
          Math.max(
            1,
            diamondWidth -
              Math.abs(Math.ceil(diamondWidth * 0.5) - lines.length + 1),
          )
        ) {
          lines.push([]);
        }
        lines.at(-1).push(unit);
      }
      break;
    default:
      throw new TypeError("invalid formation");
  }
  return lines;
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
          if (edge.type === "leftCurve") minX -= 0.5;
          if (edge.type === "rightCurve") maxX += 0.5;
          extents[row].minX = Math.min(extents[row].minX, minX);
          extents[row].maxX = Math.max(extents[row].maxX, maxX);
        }
      }
    }
  }

  // smoothen the hull
  const min = Math.min(...extents.map((e) => e.minX));
  const max = Math.max(...extents.map((e) => e.maxX));
  for (let e of extents) {
    e.minX = e.minX * 0.25 + min * 0.75;
    e.maxX = e.maxX * 0.25 + max * 0.75;
  }

  return extents;
}
