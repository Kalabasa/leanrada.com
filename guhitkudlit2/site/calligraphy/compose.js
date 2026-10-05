/**
 * @typedef {import("./stroke.js").GlyphStrokes} GlyphStrokes
 * @typedef {import("./stroke.js").StrokeVertex} StrokeVertex
 * @typedef {import("./stroke.js").Point} Point
 */

import { DEBUG } from "../app/flags.js";

const composeStepsParam =
  DEBUG && new URLSearchParams(location.search).get("composeSteps");

/**
 * @param {GlyphStrokes[]} glyphStrokesList
 */
export function compose(glyphStrokesList) {
  const glyphs = glyphStrokesList.map(({ strokes }) => {
    const vertices = strokes
      .flatMap((stroke) => stroke.vertices)
      .filter((vertex) => !vertex.parent);
    const centroid = calculateCentroid(vertices);
    const origOffsets = new Map();
    for (const vertex of vertices) {
      origOffsets.set(vertex, {
        x: vertex.position.x - centroid.x,
        y: vertex.position.y - centroid.y,
      });
    }

    return { vertices, origOffsets };
  });

  const vertices = glyphs.flatMap((glyph) => glyph.vertices);

  const offsets = new Map();

  const pushVertex = (vertex, x, y) => {
    const offset = offsets.get(getRootVertex(vertex));
    offset.x += x;
    offset.y += y;
  };

  const center = calculateCentroid(vertices);
  const extent = calculateDiagonalExtent(vertices);

  const steps = composeStepsParam ? Number.parseInt(composeStepsParam) : 20;
  for (let step = 0; step < steps; step++) {
    for (const vertex of vertices) {
      offsets.set(vertex, { x: 0, y: 0 });
    }

    for (const glyph of glyphs) {
      const centroid = calculateCentroid(glyph.vertices);

      const centerPullFactor =
        /* locked. go iterate on pushAmount */ 0.025 *
        (Math.sqrt(steps - step) / Math.sqrt(extent));
      const centerDx = (center.x - centroid.x) * centerPullFactor;
      const centerDy = (center.y - centroid.y) * centerPullFactor;

      for (const vertex of glyph.vertices) {
        // pull back to original shape
        const startOffset = glyph.origOffsets.get(vertex);
        pushVertex(
          vertex,
          (centroid.x + startOffset.x - vertex.position.x) * 0,
          (centroid.y + startOffset.y - vertex.position.y) * 0,
        );
        // pull all towards center
        pushVertex(vertex, centerDx, centerDy);
      }
    }

    // flush
    for (const vertex of vertices) {
      const offset = offsets.get(vertex);
      vertex.position.x += offset.x;
      vertex.position.y += offset.y;
    }

    for (const vertex of vertices) {
      offsets.set(vertex, { x: 0, y: 0 });
    }

    // vertices repel
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const vertex = vertices[i];
        const otherVertex = vertices[j];
        if (vertex.glyph === otherVertex.glyph) continue;

        const dx = vertex.position.x - otherVertex.position.x;
        const dy = vertex.position.y - otherVertex.position.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1e-6) continue;

        const pushAmount = 40 / ((20 * dist) ** 4 + 1);
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
 * @param {StrokeVertex} vertex
 * @returns {StrokeVertex}
 */
function getRootVertex(vertex) {
  while (vertex.parent) vertex = vertex.parent;
  return vertex;
}

/**
 * @param {StrokeVertex[]} vertices
 * @returns {Point}
 */
function calculateCentroid(vertices) {
  let sumX = 0;
  let sumY = 0;
  for (const vertex of vertices) {
    sumX += vertex.position.x;
    sumY += vertex.position.y;
  }
  return { x: sumX / vertices.length, y: sumY / vertices.length };
}

/**
 * @param {StrokeVertex[]} vertices
 * @returns {number}
 */
function calculateDiagonalExtent(vertices) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const vertex of vertices) {
    minX = Math.min(minX, vertex.position.x);
    minY = Math.min(minY, vertex.position.y);
    maxX = Math.max(maxX, vertex.position.x);
    maxY = Math.max(maxY, vertex.position.y);
  }
  return Math.hypot(maxX - minX, maxY - minY);
}
