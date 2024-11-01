/**
 * @typedef {import("../authoring/node-editor.js").Node} Node
 *
 * A path is an array of Strokes.
 * 
 * @typedef {{
 *  vertices: Vertex[]
 * }} Stroke
 *
 * @typedef {{
 *  x: number,
 *  y: number,
 * }} Vertex
 *
 * @typedef {{
 *  posErrorWeight: number,
 *  velErrorWeight: number,
 *  accelErrorWeight: number,
 *  lookaheadTime: number,
 *  iterations: number,
 * }} TrajectoryParams
 */

/** @type {TrajectoryParams} */
export const defaultTrajectoryParams = Object.freeze({
  posErrorWeight: 0.1,
  velErrorWeight: 0.95,
  accelErrorWeight: 1,
  lookaheadTime: 12,
  iterations: 1,
});

/**
 * Path is a collection of strokes.
 *
 * @param {Node[]} nodes
 * @param {Array<import("../authoring/edge-editor.js").Edge>} edges
 * @param {TrajectoryParams?} params
 * @return {Stroke[]}
 */
export function generatePath(nodes, edges, params = defaultTrajectoryParams) {
  const components = findComponents(nodes, edges);
  return components.map((component) => {
    const sequence = toNodeSequence(component, edges);
    const vertices = generateStroke(Array.from(sequence), params);
    return { vertices: Array.from(vertices) };
  });
}

/**
 * @typedef {{
 *  t: number,
 *  pos: Vertex,
 *  vel: Vertex,
 *  accel: Vertex,
 *  jerk: Vertex,
 * }} Pen
 */

/**
 * A stroke is one contiguous painting motion.
 *
 * @param {Node[]} sequence
 * @param {TrajectoryParams} params
 * @yield {Vertex}
 */
function* generateStroke(sequence, params) {
  if (!sequence.length) {
    return;
  }

  /** @type {Pen} */
  const pen = {
    t: 0,
    pos: { x: sequence[0].x, y: sequence[0].y },
    vel: { x: 0, y: 0 },
    accel: { x: 0, y: 0 },
    jerk: { x: 0, y: 0 },
  };

  let emergencyLimit = 10000;

  const nodeTimes = sequence.map((_, i) => i * 10);
  const step = 0.5;
  while (pen.t < nodeTimes[sequence.length - 1]) {
    optimizeTrajectory(pen, sequence, nodeTimes, params);
    integrate(pen, step);
    yield { ...pen.pos, t: pen.t };

    if (emergencyLimit-- < 0) throw new Error("Too many iterations!");
  }
}

/**
 * @param {Pen} pen
 * @param {Node[]} nodes
 * @param {number[]} nodeTimes
 * @param {TrajectoryParams} params
 */
function optimizeTrajectory(pen, nodes, nodeTimes, params) {
  const tempNode = {};

  for (let i = 0; i < Math.min(params.iterations, 10); i++) {
    let jerkX = 0;
    let jerkY = 0;
    let totalWeight = 0;

    const extrapolatedPen = structuredClone(pen);

    const step = 1.0;
    const maxT = Math.min(
      pen.t + params.lookaheadTime,
      nodeTimes[nodes.length - 1]
    );
    let prevNodeIndex = 0;

    for (let t = extrapolatedPen.t + step; t < maxT; t += step) {
      while (t > nodeTimes[prevNodeIndex + 1]) prevNodeIndex++;
      if (prevNodeIndex + 1 >= nodes.length) continue;

      const interpolatedNode = lerpNode(
        nodes[prevNodeIndex],
        nodes[prevNodeIndex + 1],
        (t - nodeTimes[prevNodeIndex]) /
          (nodeTimes[prevNodeIndex + 1] - nodeTimes[prevNodeIndex]),
        tempNode
      );

      const dt = t - extrapolatedPen.t;

      integrate(extrapolatedPen, dt);

      const posXError =
        (interpolatedNode.x - extrapolatedPen.pos.x) * params.posErrorWeight;
      const posYError =
        (interpolatedNode.y - extrapolatedPen.pos.y) * params.posErrorWeight;
      const velXError = -extrapolatedPen.vel.x * params.velErrorWeight;
      const velYError = -extrapolatedPen.vel.y * params.velErrorWeight;
      const accelXError = -extrapolatedPen.accel.x * params.accelErrorWeight;
      const accelYError = -extrapolatedPen.accel.y * params.accelErrorWeight;
      const et = t - pen.t;
      const sampleJerkX =
        ((posXError * (1.5 / et) + velXError) / et + accelXError) * (0.5 / et);
      const sampleJerkY =
        ((posYError * (1.5 / et) + velYError) / et + accelYError) * (0.5 / et);

      const weight = 1 / (1 + t - pen.t);

      jerkX += weight * sampleJerkX;
      jerkY += weight * sampleJerkY;
      totalWeight += weight;
    }

    if (totalWeight === 0) continue;
    jerkX /= totalWeight;
    jerkY /= totalWeight;
    pen.jerk.x = jerkX;
    pen.jerk.y = jerkY;
  }
}

/**
 * @param {Pen} pen
 * @param {number} [dt=1]
 * @param {Pen} [out=pen]
 * @returns {Pen} out
 */
function integrate(pen, dt = 1, out = pen) {
  const dAccelX = pen.jerk.x * dt;
  const dAccelY = pen.jerk.y * dt;
  const dVelX = (pen.accel.x + dAccelX / 3) * dt;
  const dVelY = (pen.accel.y + dAccelY / 3) * dt;
  const dPosX = (pen.vel.x + dVelX / 2) * dt;
  const dPosY = (pen.vel.y + dVelY / 2) * dt;
  out.t = pen.t + dt;
  out.accel.x = pen.accel.x + dAccelX;
  out.accel.y = pen.accel.y + dAccelY;
  out.vel.x = pen.vel.x + dVelX;
  out.vel.y = pen.vel.y + dVelY;
  out.pos.x = pen.pos.x + dPosX;
  out.pos.y = pen.pos.y + dPosY;
  return out;
}

/**
 * @param {Node} node1
 * @param {Node} node2
 * @param {number} t
 * @param {Node} out
 */
function lerpNode(node1, node2, t, out) {
  out.x = lerp(node1.x, node2.x, t);
  out.y = lerp(node1.y, node2.y, t);
  out.width = lerp(node1.width, node2.width, t);

  // slerp control points
  const v1x = node1.controlX - node1.x;
  const v1y = node1.controlY - node1.y;
  const v2x = node2.controlX - node2.x;
  const v2y = node2.controlY - node2.y;
  const v1Norm = Math.hypot(v1x, v1y);
  const v2Norm = Math.hypot(v2x, v2y);
  const u1x = v1x / v1Norm,
    u1y = v1y / v1Norm;
  const u2x = v2x / v2Norm,
    u2y = v2y / v2Norm;
  const dot = u1x * u2x + u1y * u2y;
  const theta = Math.acos(Math.max(-1, Math.min(1, dot)));
  let uInterpX, uInterpY;
  if (theta === 0) {
    uInterpX = u1x;
    uInterpY = u1y;
  } else {
    const sinTheta = Math.sin(theta);
    const factor0 = Math.sin((1 - t) * theta) / sinTheta;
    const factor1 = Math.sin(t * theta) / sinTheta;
    uInterpX = factor0 * u1x + factor1 * u2x;
    uInterpY = factor0 * u1y + factor1 * u2y;
  }
  const lengthInterp = (1 - t) * v1Norm + t * v2Norm;
  out.controlX = out.x + uInterpX * lengthInterp;
  out.controlY = out.y + uInterpY * lengthInterp;

  return out;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

//--------------------------------------------------------------------------------------------
//
// Graph functions
//
//--------------------------------------------------------------------------------------------

/**
 * Find connected components
 */
export function findComponents(nodes, edges) {
  const parent = new Map();

  const find = (x) => {
    if (parent.get(x) === x) return x;
    const root = find(parent.get(x));
    parent.set(x, root);
    return root;
  };

  const union = (x, y) => {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX !== rootY) parent.set(rootX, rootY);
  };

  // init each node as its own parent
  nodes.forEach((node) => {
    parent.set(node.id, node.id);
  });

  edges.forEach((edge) => {
    union(edge.nodes[0], edge.nodes[1]);
  });

  const components = new Map();
  nodes.forEach((node) => {
    const root = find(node.id);
    if (!components.has(root)) components.set(root, []);
    components.get(root).push(node);
  });

  return Array.from(components.values());
}

// sort pathGraph into a sequence such that adjacent nodes are next to each other in the sequence
export function* toNodeSequence(pathGraph, edges) {
  if (edges.length === 0) {
    return;
  }

  const getNodeByID = getByIDFrom(pathGraph);
  const getEdgesWithNode = getEdgesWithNodeFrom(edges);

  let startNode = null;
  for (const node of pathGraph) {
    const degree = getEdgesWithNode(node.id).length;
    if (degree === 1) {
      startNode = node;
      break;
    }
  }

  if (startNode === null) {
    throw new Error("Cyclic strokes unsupported!");
  }

  const visited = new Set();
  let currentNodeID = startNode.id;
  while (currentNodeID != null) {
    yield getNodeByID(currentNodeID);
    visited.add(currentNodeID);

    const neighbors = getEdgesWithNode(currentNodeID).flatMap((edge) =>
      edge.nodes.filter((nodeID) => !visited.has(nodeID))
    );
    if (neighbors.length > 1) throw new Error("Invalid graph structure");
    currentNodeID = neighbors[0];
  }
}

function getByIDFrom(itemsWithIDs) {
  const dict = {};
  for (const item of itemsWithIDs) {
    dict[item.id] = item;
  }
  return (id) => dict[id];
}

function getEdgesWithNodeFrom(edges) {
  const dict = {};
  for (const edge of edges) {
    (dict[edge.nodes[0]] = dict[edge.nodes[0]] ?? []).push(edge);
    (dict[edge.nodes[1]] = dict[edge.nodes[1]] ?? []).push(edge);
  }
  return (id) => dict[id] ?? [];
}
