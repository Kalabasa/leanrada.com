/**
 * @typedef {import("./glyphs.js").Glyph} Glyph
 * @typedef {import("./glyphs.js").GlyphVertex} GlyphVertex
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{
 *  position: Point,
 *  glyph: Glyph,
 *  control: Point,
 *  parent?: StrokeVertex,
 *  isJoined?: boolean,
 *  prev?: StrokeVertex,
 *  next?: StrokeVertex,
 *  prevSideLen?: number,
 *  nextSideLen?: number,
 *  isKudlit?: boolean
 * }} StrokeVertex
 * @typedef {{ strokes: { vertices: StrokeVertex[], isKudlit: boolean }[] }} GlyphStrokes
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
    vertices: interpolateChain(glyph, chain, getSharedPosition),
    isKudlit: chain[0].isKudlit === true,
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
  /** @type {Map<GlyphVertex, Set<GlyphVertex>>} */
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
    { progress: 0, offset: -0.5 },
    { progress: 0.6, offset: -0.5 },
  ],
  rightCurve: [
    { progress: 0, offset: 0.5 },
    { progress: 0.6, offset: 0.5 },
  ],
  wavy: [
    { progress: 0.2 ** 1.5, offset: 0.125 * 0.7 ** 0 },
    { progress: 0.4 ** 1.5, offset: -0.125 * 0.7 ** 1 },
    { progress: 0.6 ** 1.5, offset: 0.125 * 0.7 ** 2 },
    { progress: 0.8 ** 1.5, offset: -0.125 * 0.7 ** 3 },
  ],
};

/**
 * @param {Glyph} glyph
 * @param {GlyphVertex[]} chain
 * @param {(glyphVertex: GlyphVertex) => Point} getSharedPosition
 * @returns {StrokeVertex[]}
 */
function interpolateChain(glyph, chain, getSharedPosition) {
  const out = [createStrokeVertex(glyph, getSharedPosition(chain[0]))];
  for (let i = 1; i < chain.length; i++) {
    const start = chain[i - 1];
    const end = chain[i];
    const edgeType = start.adjacency.get(end).type;
    const midlineOffsets = edgeTypeOffsets[edgeType] ?? [];

    for (const { progress, offset } of midlineOffsets) {
      out.push(
        createStrokeVertex(
          glyph,
          calculateOffsetPosition(start, end, progress, offset),
        ),
      );
    }
    out.push(createStrokeVertex(glyph, getSharedPosition(end)));
  }
  if (chain[0].isKudlit) {
    for (const strokeVertex of out) {
      strokeVertex.isKudlit = true;
    }
  }
  return out;
}

/**
 * @param {Glyph} glyph
 * @param {Point} position
 * @returns {StrokeVertex}
 */
function createStrokeVertex(glyph, position) {
  return { position, glyph, control: { x: 0, y: 0 } };
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
 * @param {{ vertices: StrokeVertex[], isKudlit: boolean }[]} strokes
 */
function calculateControlPoints(strokes) {
  /** @type {Map<Point, StrokeVertex>} */
  const middleVertexAtPosition = new Map();
  for (const { vertices } of strokes) {
    const lensFromStart = [0];
    for (let i = 1; i < vertices.length; i++) {
      const edgeLen = Math.hypot(
        vertices[i].position.x - vertices[i - 1].position.x,
        vertices[i].position.y - vertices[i - 1].position.y,
      );
      lensFromStart.push(lensFromStart[i - 1] + edgeLen);
    }
    const strokeLen = lensFromStart.at(-1);

    for (let i = 1; i < vertices.length - 1; i++) {
      const vertex = vertices[i];
      vertex.prev = vertices[i - 1];
      vertex.next = vertices[i + 1];
      vertex.prevSideLen = lensFromStart[i];
      vertex.nextSideLen = strokeLen - lensFromStart[i];
      if (!middleVertexAtPosition.has(vertex.position)) {
        middleVertexAtPosition.set(vertex.position, vertex);
      }
    }
  }

  /** @type {Map<Point, StrokeVertex>} */
  const firstTerminalAtPosition = new Map();
  for (const { vertices } of strokes) {
    for (const terminal of [vertices[0], vertices.at(-1)]) {
      const middleVertex = middleVertexAtPosition.get(terminal.position);
      const firstTerminal = firstTerminalAtPosition.get(terminal.position);
      if (middleVertex) {
        terminal.parent = middleVertex;
      } else if (firstTerminal) {
        terminal.parent = firstTerminal;
        terminal.isJoined = true;
        firstTerminal.isJoined = true;
      } else {
        firstTerminalAtPosition.set(terminal.position, terminal);
      }
    }
  }

  for (const stroke of strokes) {
    const { vertices } = stroke;
    for (let i = 1; i < vertices.length - 1; i++) {
      vertices[i].control = calculateMiddleControl(vertices, i);
    }
    vertices[0].control = calculateTerminalControl(stroke, true);
    vertices.at(-1).control = negate(calculateTerminalControl(stroke, false));
  }

  // smoothen
  for (let iteration = 0; iteration < 4; iteration++) {
    for (const { vertices } of strokes) {
      const offsets = vertices.map(() => ({ x: 0, y: 0 }));
      for (let i = 0; i < vertices.length - 1; i++) {
        const a = vertices[i];
        const b = vertices[i + 1];
        const aControlX = a.position.x + a.control.x;
        const aControlY = a.position.y + a.control.y;
        const bControlX = b.position.x - b.control.x;
        const bControlY = b.position.y - b.control.y;
        const offsetX = (bControlX - aControlX) * 0.1;
        const offsetY = (bControlY - aControlY) * 0.1;
        offsets[i].x += offsetX;
        offsets[i].y += offsetY;
        offsets[i + 1].x += offsetX;
        offsets[i + 1].y += offsetY;
      }
      for (let i = 0; i < vertices.length; i++) {
        const control = vertices[i].control;
        const newX = control.x + offsets[i].x;
        const newY = control.y + offsets[i].y;
        const newLen = Math.hypot(newX, newY);
        if (newLen === 0) continue;
        const scale = Math.hypot(control.x, control.y) / newLen;
        vertices[i].control = {
          x: newX * scale,
          y: newY * scale,
        };
      }
    }
  }
}

/**
 * @param {StrokeVertex[]} vertices
 * @param {number} index
 * @returns {Point} control toward next
 */
function calculateMiddleControl(vertices, index) {
  const prev = vertices[index - 1];
  const vertex = vertices[index];
  const next = vertices[index + 1];

  const prevDX = vertex.position.x - prev.position.x;
  const prevDY = vertex.position.y - prev.position.y;
  const nextDX = next.position.x - vertex.position.x;
  const nextDY = next.position.y - vertex.position.y;
  const prevLen = Math.hypot(prevDX, prevDY);
  const nextLen = Math.hypot(nextDX, nextDY);
  const dot = (prevDX * nextDX + prevDY * nextDY) / (prevLen * nextLen);
  const lenFactor = ((dot + 1) / 2) ** 0.25;
  const controlLen = (Math.min(prevLen, nextLen) / 2) * lenFactor;

  const tangentX = next.position.x - prev.position.x;
  const tangentY = next.position.y - prev.position.y;
  const tangentLen = Math.hypot(tangentX, tangentY);
  if (tangentLen === 0) return { x: 0, y: 0 };
  return {
    x: (tangentX / tangentLen) * controlLen,
    y: (tangentY / tangentLen) * controlLen,
  };
}

/**
 * @param {{ vertices: StrokeVertex[], isKudlit: boolean }} stroke
 * @param {boolean} isStrokeStart
 * @returns {Point} control of terminal toward next
 */
function calculateTerminalControl(stroke, isStrokeStart) {
  const { vertices, isKudlit } = stroke;
  const terminal = isStrokeStart ? vertices[0] : vertices.at(-1);
  const next = isStrokeStart ? vertices[1] : vertices.at(-2);
  const edgeX = next.position.x - terminal.position.x;
  const edgeY = next.position.y - terminal.position.y;
  const edgeLen = Math.hypot(edgeX, edgeY);

  const parent = terminal.parent;
  if (parent && !terminal.isJoined) {
    // attached to middle of another stroke
    // align control to tangent of that stroke
    const { prev: parentPrev, next: parentNext } = parent;
    const { prevSideLen, nextSideLen } = parent;
    const isSideLenTie = Math.abs(prevSideLen - nextSideLen) < 1e-6;
    let toNextDir;
    if (isSideLenTie) {
      toNextDir = isStrokeStart;
    } else {
      toNextDir = prevSideLen < nextSideLen;
    }
    const [handleSideNeighbor, otherSideNeighbor] = toNextDir
      ? [parentPrev, parentNext]
      : [parentNext, parentPrev];

    const tangentX =
      handleSideNeighbor.position.x - otherSideNeighbor.position.x;
    const tangentY =
      handleSideNeighbor.position.y - otherSideNeighbor.position.y;
    const towardHandleSideX =
      handleSideNeighbor.position.x - terminal.position.x;
    const towardHandleSideY =
      handleSideNeighbor.position.y - terminal.position.y;

    const parentBendCross =
      tangentX * towardHandleSideY - tangentY * towardHandleSideX;
    const strokeCross = tangentX * edgeY - tangentY * edgeX;
    const doesParentBendTowardStroke = parentBendCross * strokeCross > 0;
    const handleX = doesParentBendTowardStroke ? towardHandleSideX : tangentX;
    const handleY = doesParentBendTowardStroke ? towardHandleSideY : tangentY;
    const scale = (edgeLen * 0.3) / Math.hypot(handleX, handleY);
    return { x: handleX * scale, y: handleY * scale };
  } else if (isFreeTerminal(terminal)) {
    // free terminal
    if (isKudlit) {
      return { x: 0, y: 0 };
    }
    const x = 0.1;
    const y = 0.6;
    return { x: isStrokeStart ? x : -x, y: isStrokeStart ? y : -y };
  } else {
    // attached to another terminal
    const nextControlTowardTerminal = isStrokeStart
      ? negate(next.control)
      : next.control;
    const unitX = edgeX / edgeLen;
    const unitY = edgeY / edgeLen;
    const alongEdge =
      nextControlTowardTerminal.x * unitX + nextControlTowardTerminal.y * unitY;
    return {
      x: nextControlTowardTerminal.x - 2 * alongEdge * unitX,
      y: nextControlTowardTerminal.y - 2 * alongEdge * unitY,
    };
  }
}

/**
 * @param {StrokeVertex} terminal
 * @returns {boolean}
 */
function isFreeTerminal(terminal) {
  return !terminal.parent && !terminal.isJoined;
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
 * @param {Map<GlyphVertex, Set<GlyphVertex>>} untracedNeighbors
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
 * @param {Map<GlyphVertex, Set<GlyphVertex>>} untracedNeighbors
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
      const extendedChain = extendChain(
        [...chain, neighbor],
        untracedNeighbors,
      );
      markUntraced(untracedNeighbors, end, neighbor);

      if (extendedChain === null) continue;
      if (
        bestChain === null ||
        scoreChain(extendedChain) > scoreChain(bestChain)
      ) {
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
  const len = chain.length - 1;
  const deltaX = Math.abs(chain[chain.length - 1].x - chain[0].x) + 1;
  const deltaY = Math.abs(chain[chain.length - 1].y - chain[0].y) + 1;
  let typeChanges = 0;
  for (let i = 2; i < chain.length; i++) {
    const prevEdge = chain[i - 2].adjacency.get(chain[i - 1]);
    const edge = chain[i - 1].adjacency.get(chain[i]);
    if (edge.type !== prevEdge.type) typeChanges++;
  }
  const kudlitPenalty = chain[0].isKudlit ? 1000 : 0;
  return len * (deltaX / deltaY) - typeChanges * 15 - kudlitPenalty;
}

/**
 * @param {Map<GlyphVertex, Set<GlyphVertex>>} untracedNeighbors
 * @returns {boolean}
 */
function hasUntracedEdges(untracedNeighbors) {
  for (const neighbors of untracedNeighbors.values()) {
    if (neighbors.size > 0) return true;
  }
  return false;
}

/**
 * @param {Map<GlyphVertex, Set<GlyphVertex>>} untracedNeighbors
 * @param {GlyphVertex} vertexA
 * @param {GlyphVertex} vertexB
 */
function markTraced(untracedNeighbors, vertexA, vertexB) {
  untracedNeighbors.get(vertexA).delete(vertexB);
  untracedNeighbors.get(vertexB).delete(vertexA);
}

/**
 * @param {Map<GlyphVertex, Set<GlyphVertex>>} untracedNeighbors
 * @param {GlyphVertex} vertexA
 * @param {GlyphVertex} vertexB
 */
function markUntraced(untracedNeighbors, vertexA, vertexB) {
  untracedNeighbors.get(vertexA).add(vertexB);
  untracedNeighbors.get(vertexB).add(vertexA);
}
