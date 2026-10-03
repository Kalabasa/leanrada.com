/**
 * @typedef {import("./glyphs.js").Glyph} Glyph
 * @typedef {import("./glyphs.js").GlyphVertex} GlyphVertex
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{
 *  position: Point,
 *  control: Point,
 *  attach?: StrokeVertex
 * }} StrokeVertex
 * @typedef {{ strokes: { vertices: StrokeVertex[] }[] }} GlyphStrokes
 * @typedef {Map<GlyphVertex, Set<GlyphVertex>>} UntracedNeighbors
 * @typedef {{
 *  vertex: StrokeVertex,
 *  previous: StrokeVertex,
 *  next: StrokeVertex
 * }} MiddleOccurrence
 */

/**
 * @param {Glyph} glyph laid out glyph
 * @returns {GlyphStrokes}
 */
export function traceStrokes(glyph) {
  const chains = traceChains(glyph);

  /** @type {Map<GlyphVertex, Point>} */
  const sharedPositions = new Map();
  const getSharedPosition = (glyphVertex) => {
    let position = sharedPositions.get(glyphVertex);
    if (!position) {
      position = { x: glyphVertex.x, y: glyphVertex.y };
      sharedPositions.set(glyphVertex, position);
    }
    return position;
  };

  const strokes = chains.map((chain) => ({
    vertices: interpolateChain(chain, getSharedPosition),
  }));

  calculateControlPoints(strokes);

  return { strokes };
}

/**
 * @param {Glyph} glyph
 * @returns {GlyphVertex[][]}
 */
function traceChains(glyph) {
  /** @type {GlyphVertex[]} */
  const vertices = [];
  /** @type {UntracedNeighbors} */
  const untracedNeighbors = new Map();
  for (const glyphRow of glyph.map) {
    for (const vertex of glyphRow) {
      if (!vertex) continue;
      vertices.push(vertex);
      untracedNeighbors.set(vertex, new Set(vertex.adjacency.keys()));
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
  return chains;
}

// Positive go right or down.
const edgeTypeOffsets = {
  leftCurve: [
    { progress: 0.25, offset: -0.5 },
    { progress: 0.75, offset: -0.5 },
  ],
  rightCurve: [
    { progress: 0.25, offset: 0.5 },
    { progress: 0.75, offset: 0.5 }
  ],
  wavy: [
    { progress: 0.2 ** 1.5, offset: 0.125 * 0.7 ** 0 },
    { progress: 0.4 ** 1.5, offset: -0.125 * 0.7 ** 1 },
    { progress: 0.6 ** 1.5, offset: 0.125 * 0.7 ** 2 },
    { progress: 0.8 ** 1.5, offset: -0.125 * 0.7 ** 3 },
  ],
};

/**
 * @param {GlyphVertex[]} chain
 * @param {(glyphVertex: GlyphVertex) => Point} getSharedPosition
 * @returns {StrokeVertex[]}
 */
function interpolateChain(chain, getSharedPosition) {
  const out = [createStrokeVertex(getSharedPosition(chain[0]))];
  for (let i = 1; i < chain.length; i++) {
    const start = chain[i - 1];
    const end = chain[i];
    const edgeType = start.adjacency.get(end).type;
    const midlineOffsets = edgeTypeOffsets[edgeType] ?? [];

    for (const { progress, offset } of midlineOffsets) {
      out.push(createStrokeVertex(calculateOffsetPosition(start, end, progress, offset)));
    }
    out.push(createStrokeVertex(getSharedPosition(end)));
  }
  return out;
}

/**
 * @param {Point} position
 * @returns {StrokeVertex}
 */
function createStrokeVertex(position) {
  return { position, control: { x: 0, y: 0 } };
}

/**
 * @param {GlyphVertex} start
 * @param {GlyphVertex} end
 * @param {number} progress
 * @param {number} offset
 * @returns {Point}
 */
function calculateOffsetPosition(start, end, progress, offset) {
  const edgeX = end.x - start.x;
  const edgeY = end.y - start.y;
  let perpendicularX = -edgeY;
  let perpendicularY = edgeX;
  if (perpendicularX + perpendicularY < 0) {
    perpendicularX = -perpendicularX;
    perpendicularY = -perpendicularY;
  }
  return {
    x: start.x + edgeX * progress + perpendicularX * offset,
    y: start.y + edgeY * progress + perpendicularY * offset,
  };
}

/**
 * @param {{ vertices: StrokeVertex[] }[]} strokes
 */
function calculateControlPoints(strokes) {
  /** @type {Map<Point, MiddleOccurrence>} */
  const middleOccurrences = new Map();
  for (const { vertices } of strokes) {
    for (let i = 1; i < vertices.length - 1; i++) {
      if (middleOccurrences.has(vertices[i].position)) continue;
      middleOccurrences.set(vertices[i].position, {
        vertex: vertices[i],
        previous: vertices[i - 1],
        next: vertices[i + 1],
      });
    }
  }

  for (const { vertices } of strokes) {
    if (vertices.length === 2) {
      const [start, end] = vertices;
      const halfEdge = {
        x: (end.position.x - start.position.x) / 2,
        y: (end.position.y - start.position.y) / 2,
      };
      start.control = halfEdge;
      end.control = { ...halfEdge };
      continue;
    }

    for (let i = 1; i < vertices.length - 1; i++) {
      vertices[i].control = calculateMiddleControl(
        vertices[i - 1],
        vertices[i],
        vertices[i + 1],
      );
    }

    const first = vertices[0];
    const second = vertices[1];
    first.control = calculateEndControlTowardNext(
      first,
      second,
      negate(second.control),
      middleOccurrences,
    );

    const last = vertices.at(-1);
    const secondLast = vertices.at(-2);
    last.control = negate(
      calculateEndControlTowardNext(
        last,
        secondLast,
        secondLast.control,
        middleOccurrences,
      ),
    );
  }

  /** @type {Map<Point, StrokeVertex>} */
  const firstEndAtPosition = new Map();
  for (const { vertices } of strokes) {
    for (const end of [vertices[0], vertices.at(-1)]) {
      const middleOccurrence = middleOccurrences.get(end.position);
      const firstEnd = firstEndAtPosition.get(end.position);
      if (middleOccurrence) {
        end.attach = middleOccurrence.vertex;
      } else if (firstEnd) {
        end.attach = firstEnd;
      } else {
        firstEndAtPosition.set(end.position, end);
      }
    }
  }
}

/**
 * @param {StrokeVertex} previous
 * @param {StrokeVertex} vertex
 * @param {StrokeVertex} next
 * @returns {Point} control toward next
 */
function calculateMiddleControl(previous, vertex, next) {
  const inX = vertex.position.x - previous.position.x;
  const inY = vertex.position.y - previous.position.y;
  const outX = next.position.x - vertex.position.x;
  const outY = next.position.y - vertex.position.y;
  const inLength = Math.hypot(inX, inY);
  const outLength = Math.hypot(outX, outY);
  const dot = (inX * outX + inY * outY) / (inLength * outLength);
  const lengthFactor = ((dot + 1) / 2) ** 0.25;
  const controlLength = (Math.min(inLength, outLength) / 2) * lengthFactor;

  const tangentX = next.position.x - previous.position.x;
  const tangentY = next.position.y - previous.position.y;
  const tangentLength = Math.hypot(tangentX, tangentY);
  if (tangentLength === 0) return { x: 0, y: 0 };
  return {
    x: (tangentX / tangentLength) * controlLength,
    y: (tangentY / tangentLength) * controlLength,
  };
}

/**
 * @param {StrokeVertex} end
 * @param {StrokeVertex} next
 * @param {Point} nextControlTowardEnd
 * @param {Map<Point, MiddleOccurrence>} middleOccurrences
 * @returns {Point} control of end toward next
 */
function calculateEndControlTowardNext(
  end,
  next,
  nextControlTowardEnd,
  middleOccurrences,
) {
  const edgeX = next.position.x - end.position.x;
  const edgeY = next.position.y - end.position.y;
  const edgeLength = Math.hypot(edgeX, edgeY);

  const middleOccurrence = middleOccurrences.get(end.position);
  if (middleOccurrence) {
    let tangentX =
      middleOccurrence.next.position.x - middleOccurrence.previous.position.x;
    let tangentY =
      middleOccurrence.next.position.y - middleOccurrence.previous.position.y;
    if (tangentX * edgeX + tangentY * edgeY < 0) {
      tangentX = -tangentX;
      tangentY = -tangentY;
    }
    const scale = edgeLength / 2 / Math.hypot(tangentX, tangentY);
    return { x: tangentX * scale, y: tangentY * scale };
  }

  const unitX = edgeX / edgeLength;
  const unitY = edgeY / edgeLength;
  const alongEdge = nextControlTowardEnd.x * unitX + nextControlTowardEnd.y * unitY;
  return {
    x: nextControlTowardEnd.x - 2 * alongEdge * unitX,
    y: nextControlTowardEnd.y - 2 * alongEdge * unitY,
  };
}

/**
 * @param {Point} point
 * @returns {Point}
 */
function negate(point) {
  return { x: -point.x, y: -point.y };
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
