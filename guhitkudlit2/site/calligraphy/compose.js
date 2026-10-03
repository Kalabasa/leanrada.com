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
      .filter((vertex) => !vertex.attach);
    const centroid = calculateCentroid(vertices.map((vertex) => vertex.position));
    const startOffsets = new Map();
    for (const vertex of vertices) {
      startOffsets.set(vertex, {
        x: vertex.position.x - centroid.x,
        y: vertex.position.y - centroid.y,
      });
    }

    const edges = [];
    for (const stroke of strokes) {
      for (let i = 1; i < stroke.vertices.length; i++) {
        edges.push([stroke.vertices[i - 1], stroke.vertices[i]]);
      }
    }

    return { vertices, edges, startOffsets };
  });

  const vertices = glyphs.flatMap((glyph) => glyph.vertices);
  const edges = glyphs.flatMap((glyph) =>
    glyph.edges.map(([start, end]) => ({ glyph, start, end })),
  );

  const offsets = new Map();
  const pushVertex = (vertex, x, y) => {
    const offset = offsets.get(findRootVertex(vertex));
    offset.x += x;
    offset.y += y;
  };
  const pushEdge = (edge, progress, x, y) => {
    pushVertex(
      edge.start,
      x * (1 - progress) ** 0.5,
      y * (1 - progress) ** 0.5,
    );
    pushVertex(edge.end, x * progress ** 0.5, y * progress ** 0.5);
  };
  const pushGlyph = (glyph, x, y) => {
    for (const vertex of glyph.vertices) {
      pushVertex(vertex, x / glyph.vertices.length, y / glyph.vertices.length);
    }
  };

  for (let step = 0; step < 50; step++) {
    for (const vertex of vertices) {
      offsets.set(vertex, { x: 0, y: 0 });
    }

    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const edge = edges[i];
        const otherEdge = edges[j];
        const edgeStart = edge.start.position;
        const edgeEnd = edge.end.position;
        const otherEdgeStart = otherEdge.start.position;
        const otherEdgeEnd = otherEdge.end.position;

        const edgeX = edgeEnd.x - edgeStart.x;
        const edgeY = edgeEnd.y - edgeStart.y;
        const otherEdgeX = otherEdgeEnd.x - otherEdgeStart.x;
        const otherEdgeY = otherEdgeEnd.y - otherEdgeStart.y;
        const startsX = edgeStart.x - otherEdgeStart.x;
        const startsY = edgeStart.y - otherEdgeStart.y;

        const edgeLengthSquared = edgeX * edgeX + edgeY * edgeY;
        const otherEdgeLengthSquared =
          otherEdgeX * otherEdgeX + otherEdgeY * otherEdgeY;
        const edgesDot = edgeX * otherEdgeX + edgeY * otherEdgeY;
        const edgeStartsDot = edgeX * startsX + edgeY * startsY;
        const otherEdgeStartsDot = otherEdgeX * startsX + otherEdgeY * startsY;

        const denominator =
          edgeLengthSquared * otherEdgeLengthSquared - edgesDot * edgesDot;
        let progress = 0;
        if (denominator > 0) {
          progress = clamp01(
            (edgesDot * otherEdgeStartsDot -
              edgeStartsDot * otherEdgeLengthSquared) /
              denominator,
          );
        }
        let otherProgress =
          (edgesDot * progress + otherEdgeStartsDot) / otherEdgeLengthSquared;
        if (otherProgress < 0) {
          otherProgress = 0;
          progress = clamp01(-edgeStartsDot / edgeLengthSquared);
        } else if (otherProgress > 1) {
          otherProgress = 1;
          progress = clamp01((edgesDot - edgeStartsDot) / edgeLengthSquared);
        }

        const pointX = edgeStart.x + edgeX * progress;
        const pointY = edgeStart.y + edgeY * progress;
        const otherPointX = otherEdgeStart.x + otherEdgeX * otherProgress;
        const otherPointY = otherEdgeStart.y + otherEdgeY * otherProgress;

        let dirX = pointX - otherPointX;
        let dirY = pointY - otherPointY;
        let dist = Math.hypot(dirX, dirY);
        if (dist < 1e-6) {
          dirX =
            (edgeStart.x + edgeEnd.x) / 2 -
            (otherEdgeStart.x + otherEdgeEnd.x) / 2;
          dirY =
            (edgeStart.y + edgeEnd.y) / 2 -
            (otherEdgeStart.y + otherEdgeEnd.y) / 2;
          dist = 1e-6;
        } else {
          dirX /= dist;
          dirY /= dist;
        }

        const pushAmount =
          2 / ((12 * dist) ** 2 + 1) - 0.15 / ((1.5 * dist) ** 2 + 15);
        const pushX = dirX * pushAmount;
        const pushY = dirY * pushAmount;
        pushEdge(edge, progress, pushX, pushY, pushVertex);
        pushEdge(otherEdge, otherProgress, -pushX, -pushY, pushVertex);
      }
    }

    const centroids = glyphs.map((glyph) =>
      calculateCentroid(glyph.vertices.map((vertex) => vertex.position)),
    );
    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      const centroid = centroids[i];
      for (const vertex of glyph.vertices) {
        const startOffset = glyph.startOffsets.get(vertex);
        pushVertex(
          vertex,
          (centroid.x + startOffset.x - vertex.position.x) * 0.2,
          (centroid.y + startOffset.y - vertex.position.y) * 0.2,
        );
      }

      for (let j = i + 1; j < glyphs.length; j++) {
        const dx = centroid.x - centroids[j].x;
        const dy = centroid.y - centroids[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) continue;

        const pushAmount =
          3 / ((3 * dist) ** 2 + 1) - 0.2 / ((0.5 * dist) ** 2 + 1);
        const pushX = (dx / dist) * pushAmount;
        const pushY = (dy / dist) * pushAmount;
        pushGlyph(glyph, pushX, pushY);
        pushGlyph(glyphs[j], -pushX, -pushY);
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
 * @param {StrokeVertex} vertex
 * @returns {StrokeVertex}
 */
function findRootVertex(vertex) {
  while (vertex.attach) vertex = vertex.attach;
  return vertex;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
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
