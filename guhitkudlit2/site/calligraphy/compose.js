/**
 * @typedef {import("./stroke.js").GlyphStrokes} GlyphStrokes
 * @typedef {import("./stroke.js").StrokeVertex} StrokeVertex
 * @typedef {import("./stroke.js").Point} Point
 */

import { DEBUG } from "../app/flags.js";
const composeStepsOverride = Number.parseInt(
  new URLSearchParams(location.search).get("composeSteps"),
);

const pushStrength = 0.4;
const basePushDistScale = 3.1;
const springStrength = 0.2;
const squeezeStrengthX = 0.10;
const squeezeStrengthY = 0.12;
const kudlitGravityX = 0.06;
const kudlitGravityY = 0.06;
const kudlitDistFactor = 1.8;
const krusSpringStrength = 0.03;
const maxComposeSteps =
  DEBUG && Number.isInteger(composeStepsOverride) ? composeStepsOverride : 25;

/**
 * @param {GlyphStrokes[]} glyphStrokesList
 * @param {{
 *   maxComposeSteps: number,
 *   density?: number
 * }} opts
 */
export function compose(glyphStrokesList, opts = {}) {
  const optDensity = Math.min(Math.max(opts?.density ?? 0, -2), 2);
  const density = (5 / 6) * optDensity - (1 / 6) * optDensity ** 2;
  const pushDistScale = basePushDistScale * 1.5 ** density;

  const glyphs = glyphStrokesList.map(({ strokes }) => {
    const vertices = strokes
      .flatMap((stroke) => stroke.vertices)
      .filter((vertex) => !vertex.parent);
    const centroid = calculateCentroid([{ vertices }]);
    const origOffsets = new Map();
    for (const vertex of vertices) {
      origOffsets.set(vertex, {
        x: vertex.position.x - centroid.x,
        y: vertex.position.y - centroid.y,
      });
    }

    return { strokes, vertices, origOffsets };
  });

  const edges = [];
  for (const { strokes } of glyphStrokesList) {
    for (const stroke of strokes) {
      for (let i = 1; i < stroke.vertices.length; i++) {
        const start = stroke.vertices[i - 1];
        const end = stroke.vertices[i];
        edges.push({
          start,
          end,
          origStartControl: { ...start.control },
          origEndControl: { ...end.control },
          isKudlit: stroke.isKudlit,
        });
      }
    }
  }

  /** @type {Map<StrokeVertex, Point>} */
  const vertexPushes = new Map();
  /** @type {Map<StrokeVertex, Point>} */
  const controlPushes = new Map();

  const pushVertex = (vertex, x, y) => {
    const offset = vertexPushes.get(getRootVertex(vertex));
    offset.x += x;
    offset.y += y;
  };

  const pushControl = (vertex, x, y) => {
    const offset = controlPushes.get(vertex);
    offset.x += x;
    offset.y += y;
  };

  /**
   * @param {{ start: StrokeVertex, end: StrokeVertex, isKudlit: boolean | 'krus' }} curve
   * @param {Point[]} points start, start control, end control, end
   * @param {{ isKudlit: boolean | 'krus' }} oCurve
   * @param {Point} oClosest
   */
  const pushCurve = (curve, points, oCurve, oClosest) => {
    const pushes = points.map((point) => {
      const dx = point.x - oClosest.x;
      const dy = point.y - oClosest.y;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return { x: 0, y: 0 };

      const sameGlyph = curve.start.glyph === oCurve.start.glyph;
      const distFactor = !curve.isKudlit
        ? 1
        : sameGlyph && !oCurve.isKudlit
          ? kudlitDistFactor
          : 0.9;
      const pushFactor =
        sameGlyph && !curve.isKudlit && oCurve.isKudlit ? 0.1 : 1;
      let pushAmount =
        (pushStrength * pushFactor) /
        ((pushDistScale * distFactor * dist) ** 4 + 1);
      return {
        x: (dx / dist) * pushAmount,
        y: (dy / dist) * pushAmount,
      };
    });

    pushVertex(curve.start, pushes[0].x, pushes[0].y);
    pushControl(curve.start, pushes[1].x, pushes[1].y);
    pushControl(curve.end, -pushes[2].x, -pushes[2].y);
    pushVertex(curve.end, pushes[3].x, pushes[3].y);
  };

  const center = calculateCentroid(glyphs);
  const extents = calculateExtents(glyphs);
  const extent = Math.hypot(extents.x, extents.y);

  const steps = Math.floor(
    Math.max(
      0,
      (opts?.maxComposeSteps ?? maxComposeSteps) *
        Math.min(1, 1.2 - glyphs.length / 20),
    ),
  );
  for (let step = 0; step < steps; step++) {
    for (const glyph of glyphs) {
      for (const vertex of glyph.vertices) {
        vertexPushes.set(vertex, { x: 0, y: 0 });
      }
    }
    for (const edge of edges) {
      controlPushes.set(edge.start, { x: 0, y: 0 });
      controlPushes.set(edge.end, { x: 0, y: 0 });
    }

    const springFactor =
      springStrength * Math.sqrt((steps - step) / steps) * 2.2 ** -density;
    const squeezeFactor =
      (((steps - step) / steps) ** 2 / extent ** 0.25) * 2.2 ** density;

    for (const glyph of glyphs) {
      const centroid = calculateCentroid([glyph]);
      const centerDx =
        (center.x - centroid.x) * squeezeStrengthX * squeezeFactor;
      const centerDy =
        (center.y - centroid.y) * squeezeStrengthY * squeezeFactor;

      const glyphExtents = calculateExtents([glyph]);
      const glyphSpringFactor =
        springFactor * (4 / Math.max(glyphExtents.x, glyphExtents.y));

      for (const vertex of glyph.vertices) {
        // pull back to original shape
        if (!vertex.isKudlit) {
          const startOffset = glyph.origOffsets.get(vertex);
          pushVertex(
            vertex,
            (centroid.x + startOffset.x - vertex.position.x) *
              glyphSpringFactor,
            (centroid.y + startOffset.y - vertex.position.y) *
              glyphSpringFactor,
          );
        }

        // pull all towards center
        pushVertex(vertex, centerDx, centerDy * 0.8);
      }

      // pull kudlits toward glyph
      const baseCentroid = calculateCentroid([
        {
          vertices: glyph.vertices.filter((v) => !v.isKudlit),
        },
      ]);
      const gravityFactor = ((steps - step) / steps) ** 2;
      for (const vertex of glyph.vertices) {
        if (!vertex.isKudlit) continue;
        pushVertex(
          vertex,
          (baseCentroid.x - vertex.position.x) * kudlitGravityX * gravityFactor,
          (baseCentroid.y - vertex.position.y) * kudlitGravityY * gravityFactor,
        );
      }

      // pull krus kudlit together
      const krusStrokes = glyph.strokes.filter(
        (stroke) => stroke.isKudlit === "krus",
      );
      if (krusStrokes.length === 2) {
        const [stroke, oStroke] = krusStrokes;
        const centroid = calculateCentroid([stroke]);
        const oCentroid = calculateCentroid([oStroke]);
        for (const vertex of stroke.vertices) {
          pushVertex(
            vertex,
            (oCentroid.x - centroid.x) * 0.5,
            (oCentroid.y - centroid.y) * 0.5,
          );
          for (const oVertex of oStroke.vertices) {
            const dx = vertex.position.x - oVertex.position.x;
            const dy = vertex.position.y - oVertex.position.y;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) continue;
            pushVertex(
              vertex,
              (dx / dist) * (krusSpringStrength / ((2 * dist) ** 2 + 1)),
              (dy / dist) * (krusSpringStrength / ((2 * dist) ** 2 + 1)),
            );
          }
        }
      }
    }

    // pull controls back to original shape
    for (const curve of edges) {
      pushControl(
        curve.start,
        (curve.origStartControl.x - curve.start.control.x) * springFactor,
        (curve.origStartControl.y - curve.start.control.y) * springFactor,
      );
      pushControl(
        curve.end,
        (curve.origEndControl.x - curve.end.control.x) * springFactor,
        (curve.origEndControl.y - curve.end.control.y) * springFactor,
      );
    }

    // flush
    for (const [vertex, offset] of vertexPushes) {
      vertex.position.x += offset.x;
      vertex.position.y += offset.y;
      vertexPushes.set(vertex, { x: 0, y: 0 });
    }
    for (const [vertex, offset] of controlPushes) {
      vertex.control.x += offset.x;
      vertex.control.y += offset.y;
      controlPushes.set(vertex, { x: 0, y: 0 });
    }

    // TODO cache centroids & extents
    // glyphs repel
    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      const extent = calculateExtents([glyph]);
      const centroid = calculateCentroid([glyph]);
      for (let j = i + 1; j < glyphs.length; j++) {
        const oGlyph = glyphs[j];
        const oCentroid = calculateCentroid([oGlyph]);
        const oExtent = calculateExtents([oGlyph]);
        const dx =
          (centroid.x - oCentroid.x) / ((1 + extent.x + oExtent.x) / 2);
        const dy =
          (centroid.y - oCentroid.y) / ((1 + extent.y + oExtent.y) / 2);
        const dist = Math.hypot(dx, dy);
        if (dist === 0) continue;
        const pushAmount =
          pushStrength / ((10 * pushDistScale * dist) ** 2 + 1);
        const pushX = (dx / dist) * pushAmount;
        const pushY = (dy / dist) * pushAmount;
        for (const vertex of glyph.vertices) {
          pushVertex(vertex, pushX, pushY);
        }
        for (const vertex of oGlyph.vertices) {
          pushVertex(vertex, -pushX, -pushY);
        }
      }
    }

    // curves repel
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const curve = edges[i];
        const oCurve = edges[j];
        if (
          curve.start.glyph === oCurve.start.glyph &&
          !curve.isKudlit &&
          !oCurve.isKudlit
        ) {
          continue;
        }
        if (areCurvesAdjacent(curve, oCurve)) continue;

        const points = getCurvePoints(curve);
        const oPoints = getCurvePoints(oCurve);
        const samples = getCubicBezierSamples(points);
        const oSamples = getCubicBezierSamples(oPoints);

        let closest = samples[0];
        let oClosest = oSamples[0];
        let dist = Infinity;
        for (const sample of samples) {
          for (const oSample of oSamples) {
            const sampleDist = Math.hypot(
              sample.x - oSample.x,
              sample.y - oSample.y,
            );
            if (sampleDist < dist) {
              dist = sampleDist;
              closest = sample;
              oClosest = oSample;
            }
          }
        }

        pushCurve(curve, points, oCurve, oClosest);
        pushCurve(oCurve, oPoints, curve, closest);
      }
    }

    for (const [vertex, offset] of vertexPushes) {
      vertex.position.x += offset.x;
      vertex.position.y += offset.y;
    }
    for (const [vertex, offset] of controlPushes) {
      vertex.control.x += offset.x;
      vertex.control.y += offset.y;
    }
  }
}

/**
 * @param {{ start: StrokeVertex, end: StrokeVertex }} curve
 * @returns {Point[]} start, start control, end control, end
 */
function getCurvePoints({ start, end }) {
  return [
    start.position,
    {
      x: start.position.x + start.control.x * 0.67,
      y: start.position.y + start.control.y * 0.67,
    },
    {
      x: end.position.x - end.control.x * 0.67,
      y: end.position.y - end.control.y * 0.67,
    },
    end.position,
  ];
}

/**
 * @param {Point[]} points
 * @returns {Point[]}
 */
function getCubicBezierSamples([p0, p1, p2, p3]) {
  return [0, 1 / 3, 2 / 3, 1].map((t) => {
    const u = 1 - t;
    return {
      x:
        u * u * u * p0.x +
        3 * u * u * t * p1.x +
        3 * u * t * t * p2.x +
        t * t * t * p3.x,
      y:
        u * u * u * p0.y +
        3 * u * u * t * p1.y +
        3 * u * t * t * p2.y +
        t * t * t * p3.y,
    };
  });
}

/**
 * @param {{ start: StrokeVertex, end: StrokeVertex }} curve
 * @param {{ start: StrokeVertex, end: StrokeVertex }} oCurve
 * @returns {boolean}
 */
function areCurvesAdjacent(curve, oCurve) {
  const endpoints = [getRootVertex(curve.start), getRootVertex(curve.end)];
  return (
    endpoints.includes(getRootVertex(oCurve.start)) ||
    endpoints.includes(getRootVertex(oCurve.end))
  );
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
 * @param {{ vertices: StrokeVertex[] }[]} array
 * @returns {Point}
 */
function calculateCentroid(array) {
  const vertices = array.flatMap((obj) => obj.vertices);
  let sumX = 0;
  let sumY = 0;
  for (const vertex of vertices) {
    sumX += vertex.position.x;
    sumY += vertex.position.y;
  }
  return { x: sumX / vertices.length, y: sumY / vertices.length };
}

/**
 * @param {{ vertices: StrokeVertex[] }[]} array
 * @returns {{ x: number, y: number }}
 */
function calculateExtents(array) {
  const vertices = array.flatMap((obj) => obj.vertices);
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
  return { x: maxX - minX, y: maxY - minY };
}
