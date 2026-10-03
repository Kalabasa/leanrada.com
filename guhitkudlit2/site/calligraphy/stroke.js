/**
 * @typedef {import("./glyphs.js").Glyph} Glyph
 * @typedef {import("./glyphs.js").GlyphVertex} GlyphVertex
 * @typedef {{
 *  vertices: { x: number, y: number }[]
 * }} Stroke
 * @typedef {Map<GlyphVertex, Set<GlyphVertex>>} UntracedNeighbors
 */

/**
 * @param {Glyph[]} glyphs laid out glyphs
 * @returns {Stroke[]}
 */
export function traceStrokes(glyphs) {
  /** @type {GlyphVertex[]} */
  const vertices = [];
  /** @type {UntracedNeighbors} */
  const untracedNeighbors = new Map();
  for (const glyph of glyphs) {
    for (const glyphRow of glyph.map) {
      for (const vertex of glyphRow) {
        if (!vertex) continue;
        vertices.push(vertex);
        untracedNeighbors.set(vertex, new Set(vertex.adjacency.keys()));
      }
    }
  }

  const chains = [];
  while (hasUntracedEdges(untracedNeighbors)) {
    const chain = findBestChain(vertices, untracedNeighbors);
    for (let i = 1; i < chain.length; i++) {
      markTraced(untracedNeighbors, chain[i - 1], chain[i]);
    }
    chains.push(chain);
  }

  alignControlPoints(chains);

  return chains.map((chain) => ({ vertices: sampleChain(chain) }));
}

const SAMPLES_PER_EDGE = 8;

/**
 * @param {GlyphVertex[]} chain
 * @returns {{ x: number, y: number }[]}
 */
function sampleChain(chain) {
  const samples = [chain[0]];
  for (let i = 1; i < chain.length; i++) {
    const start = chain[i - 1];
    const end = chain[i];
    const startControl = start.adjacency.get(end).control;
    const endControl = end.adjacency.get(start).control;
    const startHandle = {
      x: start.x + startControl.dx,
      y: start.y + startControl.dy,
    };
    const endHandle = {
      x: end.x + endControl.dx,
      y: end.y + endControl.dy,
    };
    for (let sample = 1; sample < SAMPLES_PER_EDGE; sample++) {
      const t = sample / SAMPLES_PER_EDGE;
      samples.push(sampleCubicBezier(start, startHandle, endHandle, end, t));
    }
    samples.push(end);
  }
  return samples;
}

/**
 * @param {{ x: number, y: number }} start
 * @param {{ x: number, y: number }} startHandle
 * @param {{ x: number, y: number }} endHandle
 * @param {{ x: number, y: number }} end
 * @param {number} t
 * @returns {{ x: number, y: number }}
 */
function sampleCubicBezier(start, startHandle, endHandle, end, t) {
  const startWeight = (1 - t) ** 3;
  const startHandleWeight = 3 * (1 - t) ** 2 * t;
  const endHandleWeight = 3 * (1 - t) * t ** 2;
  const endWeight = t ** 3;
  return {
    x:
      start.x * startWeight +
      startHandle.x * startHandleWeight +
      endHandle.x * endHandleWeight +
      end.x * endWeight,
    y:
      start.y * startWeight +
      startHandle.y * startHandleWeight +
      endHandle.y * endHandleWeight +
      end.y * endWeight,
  };
}

/**
 * @param {GlyphVertex[][]} chains
 */
function alignControlPoints(chains) {
  /** @type {Map<GlyphVertex, [GlyphVertex, GlyphVertex]>} */
  const middleNeighbors = new Map();
  for (const chain of chains) {
    for (let i = 1; i < chain.length - 1; i++) {
      if (middleNeighbors.has(chain[i])) continue;
      middleNeighbors.set(chain[i], [chain[i - 1], chain[i + 1]]);
    }
  }

  for (const chain of chains) {
    if (chain.length === 2) {
      const [start, end] = chain;
      setControl(start, end, (end.x - start.x) / 2, (end.y - start.y) / 2);
      setControl(end, start, (start.x - end.x) / 2, (start.y - end.y) / 2);
      continue;
    }

    for (let i = 1; i < chain.length - 1; i++) {
      alignMiddleControls(chain[i - 1], chain[i], chain[i + 1]);
    }
    alignEndControl(chain[0], chain[1], middleNeighbors);
    alignEndControl(chain.at(-1), chain.at(-2), middleNeighbors);
  }
}

/**
 * @param {GlyphVertex} previous
 * @param {GlyphVertex} vertex
 * @param {GlyphVertex} next
 */
function alignMiddleControls(previous, vertex, next) {
  const inX = vertex.x - previous.x;
  const inY = vertex.y - previous.y;
  const outX = next.x - vertex.x;
  const outY = next.y - vertex.y;
  const inLength = Math.hypot(inX, inY);
  const outLength = Math.hypot(outX, outY);
  const dot = (inX * outX + inY * outY) / (inLength * outLength);
  const controlLength = (Math.min(inLength, outLength) / 2) * ((dot + 1) / 2);

  const tangentX = next.x - previous.x;
  const tangentY = next.y - previous.y;
  const tangentLength = Math.hypot(tangentX, tangentY);
  let controlX = 0;
  let controlY = 0;
  if (tangentLength > 0) {
    controlX = (tangentX / tangentLength) * controlLength;
    controlY = (tangentY / tangentLength) * controlLength;
  }

  setControl(vertex, next, controlX, controlY);
  setControl(vertex, previous, -controlX, -controlY);
}

/**
 * @param {GlyphVertex} end
 * @param {GlyphVertex} next
 * @param {Map<GlyphVertex, [GlyphVertex, GlyphVertex]>} middleNeighbors
 */
function alignEndControl(end, next, middleNeighbors) {
  const edgeX = next.x - end.x;
  const edgeY = next.y - end.y;
  const edgeLength = Math.hypot(edgeX, edgeY);

  const junctionNeighbors = middleNeighbors.get(end);
  if (junctionNeighbors) {
    const [junctionPrevious, junctionNext] = junctionNeighbors;
    let tangentX = junctionNext.x - junctionPrevious.x;
    let tangentY = junctionNext.y - junctionPrevious.y;
    if (tangentX * edgeX + tangentY * edgeY < 0) {
      tangentX = -tangentX;
      tangentY = -tangentY;
    }
    const scale = edgeLength / 2 / Math.hypot(tangentX, tangentY);
    setControl(end, next, tangentX * scale, tangentY * scale);
    return;
  }

  const nextControl = next.adjacency.get(end).control;
  const unitX = edgeX / edgeLength;
  const unitY = edgeY / edgeLength;
  const alongEdge = nextControl.dx * unitX + nextControl.dy * unitY;
  setControl(
    end,
    next,
    nextControl.dx - 2 * alongEdge * unitX,
    nextControl.dy - 2 * alongEdge * unitY,
  );
}

/**
 * @param {GlyphVertex} from
 * @param {GlyphVertex} to
 * @param {number} dx
 * @param {number} dy
 */
function setControl(from, to, dx, dy) {
  from.adjacency.get(to).control = { dx, dy };
}

/**
 * @param {GlyphVertex[]} vertices
 * @param {UntracedNeighbors} untracedNeighbors
 * @returns {GlyphVertex[]}
 */
function findBestChain(vertices, untracedNeighbors) {
  let bestChain = [];
  for (const start of vertices) {
    for (const neighbor of start.adjacency.keys()) {
      if (!untracedNeighbors.get(start).has(neighbor)) continue;

      markTraced(untracedNeighbors, start, neighbor);
      const chain = extendChain([start, neighbor], untracedNeighbors);
      markUntraced(untracedNeighbors, start, neighbor);

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
 * @param {UntracedNeighbors} untracedNeighbors
 * @returns {GlyphVertex[] | null} best maximal chain, or null if every extension is a substroke
 */
function extendChain(chain, untracedNeighbors) {
  const start = chain[0];
  const end = chain[chain.length - 1];

  let isEndExtendable = false;
  let bestChain = null;
  if (!end.terminal) {
    for (const neighbor of end.adjacency.keys()) {
      if (!untracedNeighbors.get(end).has(neighbor)) continue;
      isEndExtendable = true;

      markTraced(untracedNeighbors, end, neighbor);
      const extendedChain = extendChain([...chain, neighbor], untracedNeighbors);
      markUntraced(untracedNeighbors, end, neighbor);

      if (extendedChain === null) continue;
      if (bestChain === null || scoreChain(extendedChain) > scoreChain(bestChain)) {
        bestChain = extendedChain;
      }
    }
  }
  if (isEndExtendable) return bestChain;

  if (!start.terminal && untracedNeighbors.get(start).size > 0) return null;
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

/**
 * @param {UntracedNeighbors} untracedNeighbors
 * @returns {boolean}
 */
function hasUntracedEdges(untracedNeighbors) {
  for (const neighbors of untracedNeighbors.values()) {
    if (neighbors.size > 0) return true;
  }
  return false;
}

/**
 * @param {UntracedNeighbors} untracedNeighbors
 * @param {GlyphVertex} vertexA
 * @param {GlyphVertex} vertexB
 */
function markTraced(untracedNeighbors, vertexA, vertexB) {
  untracedNeighbors.get(vertexA).delete(vertexB);
  untracedNeighbors.get(vertexB).delete(vertexA);
}

/**
 * @param {UntracedNeighbors} untracedNeighbors
 * @param {GlyphVertex} vertexA
 * @param {GlyphVertex} vertexB
 */
function markUntraced(untracedNeighbors, vertexA, vertexB) {
  untracedNeighbors.get(vertexA).add(vertexB);
  untracedNeighbors.get(vertexB).add(vertexA);
}
