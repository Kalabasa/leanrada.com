/**
 * @typedef {import("./glyphs.js").Glyph} Glyph
 * @typedef {{
 *  vertices: { x: number, y: number }[]
 * }} Stroke
 */

/**
 * @param {Glyph[]} glyphs laid out glyphs
 * @returns {Stroke[]}
 */
export function traceStrokes(glyphs) {
  const tracedEdges = new Set();
  const strokes = [];

  for (const glyph of glyphs) {
    for (const glyphRow of glyph.map) {
      for (const vertex of glyphRow) {
        if (!vertex) continue;

        for (const [neighbor, edge] of vertex.adjacency) {
          if (tracedEdges.has(edge)) continue;
          tracedEdges.add(edge);

          strokes.push({
            vertices: [
              { x: vertex.x, y: vertex.y },
              { x: neighbor.x, y: neighbor.y },
            ],
          });
        }
      }
    }
  }

  return strokes;
}
