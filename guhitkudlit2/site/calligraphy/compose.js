/**
 * @param {Glyph[]} layout2D
 */
export function compose(layout2D) {
  const glyphs = layout2D.map((glyph) => {
    const vertices = glyph.map.flat().filter((vertex) => vertex);
    const centroid = calculateCentroid(vertices);
    const startOffsets = new Map();
    for (const vertex of vertices) {
      startOffsets.set(vertex, {
        x: vertex.x - centroid.x,
        y: vertex.y - centroid.y,
      });
    }

    const edges = [];
    const seenEdges = new Set();
    for (const vertex of vertices) {
      for (const [neighbor, edge] of vertex.adjacency) {
        if (seenEdges.has(edge)) continue;
        seenEdges.add(edge);
        edges.push([vertex, neighbor]);
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
    const offset = offsets.get(vertex);
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

        const edgeX = edge.end.x - edge.start.x;
        const edgeY = edge.end.y - edge.start.y;
        const otherEdgeX = otherEdge.end.x - otherEdge.start.x;
        const otherEdgeY = otherEdge.end.y - otherEdge.start.y;
        const startsX = edge.start.x - otherEdge.start.x;
        const startsY = edge.start.y - otherEdge.start.y;

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

        const pointX = edge.start.x + edgeX * progress;
        const pointY = edge.start.y + edgeY * progress;
        const otherPointX = otherEdge.start.x + otherEdgeX * otherProgress;
        const otherPointY = otherEdge.start.y + otherEdgeY * otherProgress;

        let dirX = pointX - otherPointX;
        let dirY = pointY - otherPointY;
        let dist = Math.hypot(dirX, dirY);
        if (dist < 1e-6) {
          dirX =
            (edge.start.x + edge.end.x) / 2 -
            (otherEdge.start.x + otherEdge.end.x) / 2;
          dirY =
            (edge.start.y + edge.end.y) / 2 -
            (otherEdge.start.y + otherEdge.end.y) / 2;
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

    const centroids = glyphs.map((glyph) => calculateCentroid(glyph.vertices));
    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      const centroid = centroids[i];
      for (const vertex of glyph.vertices) {
        const startOffset = glyph.startOffsets.get(vertex);
        pushVertex(
          vertex,
          (centroid.x + startOffset.x - vertex.x) * 0.2,
          (centroid.y + startOffset.y - vertex.y) * 0.2,
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
      vertex.x += offset.x;
      vertex.y += offset.y;
    }
  }
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
