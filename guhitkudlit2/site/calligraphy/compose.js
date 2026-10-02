/**
 * @typedef {import("./glyphs.js").Glyph} Glyph
 * @typedef {import("./glyphs.js").GlyphVertex} GlyphVertex
 * @typedef {{ x: number, y: number }} Point
 */

const STEPS = 300;
const DAMPING = 0.8;
const SHAPE_STIFFNESS = 0.05;
const BASELINE_STIFFNESS = 0.02;
const COLLISION_RADIUS = 0.6;
const COLLISION_STIFFNESS = 0.5;
const EDGE_SAMPLE_SPACING = 0.25;
const PACKING_FORCE = 0.1;
const FLOW_STIFFNESS = 0.05;
const FLOW_RADIUS = 2;

/**
 * @param {Glyph[]} layout2D
 */
export function compose(layout2D) {
  const glyphs = layout2D.map(createBody);
  const allVertices = glyphs.flatMap((glyph) => glyph.vertices);
  const lines = findLines(glyphs);
  const neighborPairs = [];
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      neighborPairs.push([line[i - 1], line[i]]);
    }
  }
  const restLineCentersX = lines.map(getLineCenterX);

  const velocities = new Map();
  for (const vertex of allVertices) {
    velocities.set(vertex, { x: 0, y: 0 });
  }

  for (let step = 0; step < STEPS; step++) {
    const forces = new Map();
    for (const vertex of allVertices) {
      forces.set(vertex, { x: 0, y: 0 });
    }
    const addForce = (vertex, x, y) => {
      const force = forces.get(vertex);
      force.x += x;
      force.y += y;
    };
    const addGlyphForce = (glyph, x) => {
      for (const vertex of glyph.vertices) {
        addForce(vertex, x / glyph.vertices.length, 0);
      }
    };

    for (const glyph of glyphs) {
      const centroid = getCentroid(glyph.vertices);
      for (const vertex of glyph.vertices) {
        const restOffset = glyph.restOffsets.get(vertex);
        addForce(
          vertex,
          (centroid.x + restOffset.x - vertex.x) * SHAPE_STIFFNESS,
          (centroid.y + restOffset.y - vertex.y) * SHAPE_STIFFNESS,
        );
        addForce(vertex, 0, (glyph.restY.get(vertex) - vertex.y) * BASELINE_STIFFNESS);
      }
    }

    for (let i = 0; i < glyphs.length; i++) {
      for (let j = i + 1; j < glyphs.length; j++) {
        let pushX = 0;
        for (const sample of sampleEdges(glyphs[i].edges)) {
          for (const otherSample of sampleEdges(glyphs[j].edges)) {
            const distance = getDistance(sample, otherSample);
            if (distance === 0 || distance >= COLLISION_RADIUS) continue;
            const strength =
              (COLLISION_STIFFNESS * (COLLISION_RADIUS - distance)) / distance;
            pushX += (sample.x - otherSample.x) * strength;
          }
        }
        addGlyphForce(glyphs[i], pushX);
        addGlyphForce(glyphs[j], -pushX);
      }
    }

    for (const [leftGlyph, rightGlyph] of neighborPairs) {
      addGlyphForce(leftGlyph, PACKING_FORCE);
      addGlyphForce(rightGlyph, -PACKING_FORCE);
    }

    for (const [leftGlyph, rightGlyph] of neighborPairs) {
      for (const edge of leftGlyph.edges) {
        for (const otherEdge of rightGlyph.edges) {
          alignEdges(edge, otherEdge, addForce);
        }
      }
    }

    for (const vertex of allVertices) {
      const velocity = velocities.get(vertex);
      const force = forces.get(vertex);
      velocity.x = (velocity.x + force.x) * DAMPING;
      velocity.y = (velocity.y + force.y) * DAMPING;
      vertex.x += velocity.x;
      vertex.y += velocity.y;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const shiftX = restLineCentersX[i] - getLineCenterX(lines[i]);
    for (const glyph of lines[i]) {
      for (const vertex of glyph.vertices) {
        vertex.x += shiftX;
      }
    }
  }
}

/**
 * @param {Glyph} glyph
 */
function createBody(glyph) {
  const vertices = glyph.map.flat().filter((vertex) => vertex);
  const centroid = getCentroid(vertices);
  const restOffsets = new Map();
  const restY = new Map();
  for (const vertex of vertices) {
    restOffsets.set(vertex, { x: vertex.x - centroid.x, y: vertex.y - centroid.y });
    restY.set(vertex, vertex.y);
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

  return { vertices, edges, restOffsets, restY };
}

function findLines(glyphs) {
  const lines = [[glyphs[0]]];
  for (let i = 1; i < glyphs.length; i++) {
    const leftGlyph = glyphs[i - 1];
    const rightGlyph = glyphs[i];
    const leftMaxY = Math.max(...leftGlyph.vertices.map((vertex) => vertex.y));
    const rightMinY = Math.min(...rightGlyph.vertices.map((vertex) => vertex.y));
    if (rightMinY > leftMaxY) {
      lines.push([rightGlyph]);
    } else {
      lines.at(-1).push(rightGlyph);
    }
  }
  return lines;
}

function getLineCenterX(line) {
  const xs = line.flatMap((glyph) => glyph.vertices.map((vertex) => vertex.x));
  return (Math.min(...xs) + Math.max(...xs)) / 2;
}

/**
 * @param {[GlyphVertex, GlyphVertex][]} edges
 */
function sampleEdges(edges) {
  const samples = [];
  for (const [start, end] of edges) {
    const sampleCount = Math.max(1, Math.ceil(getDistance(start, end) / EDGE_SAMPLE_SPACING));
    for (let i = 0; i <= sampleCount; i++) {
      const progress = i / sampleCount;
      samples.push({
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
      });
    }
  }
  return samples;
}

/**
 * @param {[GlyphVertex, GlyphVertex]} edge
 * @param {[GlyphVertex, GlyphVertex]} otherEdge
 * @param {(vertex: GlyphVertex, x: number, y: number) => void} addForce
 */
function alignEdges(edge, otherEdge, addForce) {
  const distance = getDistance(getCentroid(edge), getCentroid(otherEdge));
  if (distance >= FLOW_RADIUS) return;
  const closeness = (FLOW_RADIUS - distance) / FLOW_RADIUS;

  let angleDifference = getAngle(otherEdge) - getAngle(edge);
  while (angleDifference > Math.PI / 2) angleDifference -= Math.PI;
  while (angleDifference <= -Math.PI / 2) angleDifference += Math.PI;

  const rotation = (angleDifference / 2) * closeness * FLOW_STIFFNESS;
  rotateEdge(edge, rotation, addForce);
  rotateEdge(otherEdge, -rotation, addForce);
}

/**
 * @param {[GlyphVertex, GlyphVertex]} edge
 * @returns {number}
 */
function getAngle([start, end]) {
  return Math.atan2(end.y - start.y, end.x - start.x);
}

/**
 * @param {[GlyphVertex, GlyphVertex]} edge
 * @param {number} rotation
 * @param {(vertex: GlyphVertex, x: number, y: number) => void} addForce
 */
function rotateEdge(edge, rotation, addForce) {
  const midpoint = getCentroid(edge);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  for (const vertex of edge) {
    const offsetX = vertex.x - midpoint.x;
    const offsetY = vertex.y - midpoint.y;
    const rotatedX = midpoint.x + offsetX * cos - offsetY * sin;
    const rotatedY = midpoint.y + offsetX * sin + offsetY * cos;
    addForce(vertex, rotatedX - vertex.x, rotatedY - vertex.y);
  }
}

/**
 * @param {Point[]} points
 * @returns {Point}
 */
function getCentroid(points) {
  let sumX = 0;
  let sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  return { x: sumX / points.length, y: sumY / points.length };
}

/**
 * @param {Point} from
 * @param {Point} to
 * @returns {number}
 */
function getDistance(from, to) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}
