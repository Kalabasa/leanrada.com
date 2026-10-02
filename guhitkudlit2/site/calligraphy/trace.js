/**
 * @typedef {import("./glyphs.js").Glyph} Glyph
 * @typedef {import("./glyphs.js").GlyphVertex} GlyphVertex
 * @typedef {{
 *  vertices: { x: number, y: number }[]
 * }} Stroke
 */

/**
 * @param {Glyph[]} glyphs laid out glyphs
 * @returns {Stroke[]}
 */
export function traceStrokes(glyphs) {
  /** @type {GlyphVertex[]} */
  const vertices = [];
  const untracedEdges = new Set();
  for (const glyph of glyphs) {
    for (const glyphRow of glyph.map) {
      for (const vertex of glyphRow) {
        if (!vertex) continue;
        vertices.push(vertex);
        for (const edge of vertex.adjacency.values()) {
          untracedEdges.add(edge);
        }
      }
    }
  }

  const chains = [];
  while (untracedEdges.size > 0) {
    const chain = findBestChain(vertices, untracedEdges);
    for (let i = 1; i < chain.length; i++) {
      untracedEdges.delete(chain[i - 1].adjacency.get(chain[i]));
    }
    chains.push(chain);
  }

  return chains.map((chain) => ({ vertices: chain }));
}

/**
 * @param {GlyphVertex[]} vertices
 * @param {Set<object>} untracedEdges
 * @returns {GlyphVertex[]}
 */
function findBestChain(vertices, untracedEdges) {
  let bestChain = [];
  for (const start of vertices) {
    for (const [neighbor, edge] of start.adjacency) {
      if (!untracedEdges.has(edge)) continue;

      untracedEdges.delete(edge);
      const chain = extendChain([start, neighbor], untracedEdges);
      untracedEdges.add(edge);

      if (chain === null) continue;
      // TODO: tiebreaker for chains of equal score
      if (bestChain.length === 0 || scoreChain(chain) > scoreChain(bestChain)) {
        bestChain = chain;
      }
    }
  }
  return bestChain;
}

/**
 * @param {GlyphVertex[]} chain
 * @param {Set<object>} untracedEdges
 * @returns {GlyphVertex[] | null} best maximal chain, or null if every extension is a substroke
 */
function extendChain(chain, untracedEdges) {
  const start = chain[0];
  const end = chain[chain.length - 1];

  let isEndExtendable = false;
  let bestChain = null;
  if (!end.terminal) {
    for (const [neighbor, edge] of end.adjacency) {
      if (!untracedEdges.has(edge)) continue;
      isEndExtendable = true;

      untracedEdges.delete(edge);
      const extendedChain = extendChain([...chain, neighbor], untracedEdges);
      untracedEdges.add(edge);

      if (extendedChain === null) continue;
      if (bestChain === null || scoreChain(extendedChain) > scoreChain(bestChain)) {
        bestChain = extendedChain;
      }
    }
  }
  if (isEndExtendable) return bestChain;

  if (!start.terminal) {
    for (const edge of start.adjacency.values()) {
      if (untracedEdges.has(edge)) return null;
    }
  }
  return chain;
}

/**
 * @param {GlyphVertex[]} chain
 * @returns {number}
 */
function scoreChain(chain) {
  const length = chain.length - 1;
  const deltaY = Math.abs(chain[chain.length - 1].y - chain[0].y) + 1;
  let typeChanges = 0;
  for (let i = 2; i < chain.length; i++) {
    const previousEdge = chain[i - 2].adjacency.get(chain[i - 1]);
    const edge = chain[i - 1].adjacency.get(chain[i]);
    if (edge.type !== previousEdge.type) typeChanges++;
  }
  return length / deltaY - typeChanges * 4;
}
