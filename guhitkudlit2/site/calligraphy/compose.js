/**
 * @typedef {import("./stroke.js").GlyphStrokes} GlyphStrokes
 * @typedef {import("./stroke.js").StrokeVertex} StrokeVertex
 * @typedef {import("./stroke.js").Point} Point
 */

/**
 * @param {GlyphStrokes[]} glyphStrokesList
 */
export function compose(glyphStrokesList) {
  const glyphs = glyphStrokesList.map(({ strokes }) => {
    const vertices = strokes
      .flatMap((stroke) => stroke.vertices)
      .filter((vertex) => !vertex.parent);
    const centroid = calculateCentroid(
      vertices.map((vertex) => vertex.position),
    );
    const startOffsets = new Map();
    for (const vertex of vertices) {
      startOffsets.set(vertex, {
        x: vertex.position.x - centroid.x,
        y: vertex.position.y - centroid.y,
      });
    }

    return { vertices, startOffsets };
  });

  const vertices = glyphs.flatMap((glyph) => glyph.vertices);
  const nearVerticesByVertex = findNearVertices(
    glyphStrokesList.flatMap(({ strokes }) => strokes),
  );

  const offsets = new Map();
  const pushVertex = (vertex, x, y) => {
    const offset = offsets.get(findRootVertex(vertex));
    offset.x += x;
    offset.y += y;
  };
  const pushGlyph = (glyph, x, y) => {
    for (const vertex of glyph.vertices) {
      pushVertex(vertex, x / glyph.vertices.length, y / glyph.vertices.length);
    }
  };

  for (let step = 0; step < 100; step++) {
    for (const vertex of vertices) {
      offsets.set(vertex, { x: 0, y: 0 });
    }

    const centroids = glyphs.map((glyph) =>
      calculateCentroid(glyph.vertices.map((vertex) => vertex.position)),
    );
    const overallCentroid = calculateCentroid(
      vertices.map((vertex) => vertex.position),
    );
    const overallExtent = calculateDiagonalExtent(
      vertices.map((vertex) => vertex.position),
    );

    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      const centroid = centroids[i];

      // pull back to original shape
      for (const vertex of glyph.vertices) {
        const startOffset = glyph.startOffsets.get(vertex);
        pushVertex(
          vertex,
          (centroid.x + startOffset.x - vertex.position.x) * 0.002,
          (centroid.y + startOffset.y - vertex.position.y) * 0.002,
        );
      }

      // pull all towards center
      const dx = centroid.x - overallCentroid.x;
      const dy = centroid.y - overallCentroid.y;
      pushGlyph(glyph, -dx * (0.1 / overallExtent), -dy * (0.1 / overallExtent));
    }

    for (const vertex of vertices) {
      const offset = offsets.get(vertex);
      vertex.position.x += offset.x;
      vertex.position.y += offset.y;
    }

    for (const vertex of vertices) {
      offsets.set(vertex, { x: 0, y: 0 });
    }

    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const vertex = vertices[i];
        const otherVertex = vertices[j];
        if (nearVerticesByVertex.get(vertex).has(otherVertex)) continue;

        const dx = vertex.position.x - otherVertex.position.x;
        const dy = vertex.position.y - otherVertex.position.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1e-6) continue;

        // vertices repel
        const pushAmount = 20 / ((15 * dist) ** 4 + 1);
        const pushX = (dx / dist) * pushAmount;
        const pushY = (dy / dist) * pushAmount;
        pushVertex(vertex, pushX, pushY);
        pushVertex(otherVertex, -pushX, -pushY);
      }
    }

    for (const vertex of vertices) {
      const offset = offsets.get(vertex);
      vertex.position.x += offset.x;
      vertex.position.y += offset.y;
    }
  }
}

/**
 * @param {{ vertices: StrokeVertex[] }[]} strokes
 * @returns {Map<StrokeVertex, Set<StrokeVertex>>} root vertices within N hops of each root vertex
 */
function findNearVertices(strokes) {
  const maxHops = 3;

  /** @type {Map<StrokeVertex, Set<StrokeVertex>>} */
  const neighborsByRootVertex = new Map();
  const addNeighbor = (rootVertex, neighbor) => {
    if (!neighborsByRootVertex.has(rootVertex)) {
      neighborsByRootVertex.set(rootVertex, new Set());
    }
    neighborsByRootVertex.get(rootVertex).add(neighbor);
  };
  for (const { vertices } of strokes) {
    for (let i = 1; i < vertices.length; i++) {
      const prevRoot = findRootVertex(vertices[i - 1]);
      const root = findRootVertex(vertices[i]);
      addNeighbor(prevRoot, root);
      addNeighbor(root, prevRoot);
    }
  }

  /** @type {Map<StrokeVertex, Set<StrokeVertex>>} */
  const nearVerticesByVertex = new Map();
  for (const rootVertex of neighborsByRootVertex.keys()) {
    const nearVertices = new Set([rootVertex]);
    let frontier = [rootVertex];
    for (let hop = 0; hop < maxHops; hop++) {
      const nextFrontier = [];
      for (const frontierVertex of frontier) {
        for (const neighbor of neighborsByRootVertex.get(frontierVertex)) {
          if (nearVertices.has(neighbor)) continue;
          nearVertices.add(neighbor);
          nextFrontier.push(neighbor);
        }
      }
      frontier = nextFrontier;
    }
    nearVerticesByVertex.set(rootVertex, nearVertices);
  }
  return nearVerticesByVertex;
}

/**
 * @param {StrokeVertex} vertex
 * @returns {StrokeVertex}
 */
function findRootVertex(vertex) {
  while (vertex.parent) vertex = vertex.parent;
  return vertex;
}

/**
 * @param {Point[]} points
 * @returns {Point}
 */
function calculateCentroid(points) {
  let sumX = 0;
  let sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  return { x: sumX / points.length, y: sumY / points.length };
}

/**
 * @param {Point[]} points
 * @returns {number}
 */
function calculateDiagonalExtent(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return Math.hypot(maxX - minX, maxY - minY);
}
