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
 *  debug?: {
 *    pen: Pen,
 *  },
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
  posErrorWeight: 0.5,
  velErrorWeight: 0.95,
  accelErrorWeight: 1,
  lookaheadTime: 3,
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

  const nodeTimes = generateNodeTimes(sequence);

  const step = 0.5;
  while (pen.t < nodeTimes[sequence.length - 1]) {
    optimizeTrajectory(pen, sequence, nodeTimes, params);
    integrate(pen, step);
    const debug = {
      pen: structuredClone(pen),
    };
    yield { ...pen.pos, debug };

    if (emergencyLimit-- < 0) throw new Error("Too many iterations!");
  }
}

/**
 * @param {Node[]} nodes
 * @returns {number[]}
 */
function generateNodeTimes(nodes) {
  const nodeTimes = [];
  let lastNode = null;
  let t = 0;
  for (const node of nodes) {
    if (lastNode) {
      t += Math.hypot(node.x - lastNode.x, node.y - lastNode.y) / 30;
    }
    nodeTimes.push(t);
    lastNode = node;
  }
  return nodeTimes;
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

    const extrapolatedPen = structuredClone(pen);

    const step = 1.0;
    const maxT = Math.min(
      pen.t + params.lookaheadTime,
      nodeTimes[nodes.length - 1]
    );
    let prevNodeIndex = 0;

    for (let t = extrapolatedPen.t + step; t <= maxT; t += step) {
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

      const error = calculateError(extrapolatedPen.pos, interpolatedNode);

      const posXError = error.x;
      const posYError = error.y;
      const targetVelX = (params.posErrorWeight * posXError) / dt;
      const targetVelY = (params.posErrorWeight * posYError) / dt;
      const velXError = targetVelX - extrapolatedPen.vel.x;
      const velYError = targetVelY - extrapolatedPen.vel.y;
      const targetAccelX = (params.velErrorWeight * velXError) / dt;
      const targetAccelY = (params.velErrorWeight * velYError) / dt;
      const accelXError = targetAccelX - extrapolatedPen.accel.x;
      const accelYError = targetAccelY - extrapolatedPen.accel.y;
      const targetJerkX = (params.accelErrorWeight * accelXError) / dt;
      const targetJerkY = (params.accelErrorWeight * accelYError) / dt;
      const jerkXError = targetJerkX - extrapolatedPen.jerk.x;
      const jerkYError = targetJerkY - extrapolatedPen.jerk.y;

      pen.jerk.x += jerkXError;
      pen.jerk.y += jerkYError;
      extrapolatedPen.jerk.x += jerkXError;
      extrapolatedPen.jerk.y += jerkYError;
    }
  }
}

/**
 * @param {{ x: number, y: number }} pos
 * @param {Node} target
 */
function calculateError(pos, target) {
  const deltaX = target.x - pos.x;
  const deltaY = target.y - pos.y;

  const localControlX = target.controlX - target.x;
  const localControlY = target.controlY - target.y;

  const halfHeight = Math.hypot(localControlX, localControlY);
  const halfWidth = target.width * 0.5;

  const angle = Math.atan2(localControlY, localControlX);
  const radiusX =
    (halfHeight * halfWidth) /
    Math.sqrt(
      (halfWidth * Math.cos(-angle)) ** 2 + (halfHeight * Math.sin(-angle)) ** 2
    );
  const radiusY =
    (halfWidth * halfHeight) /
    Math.sqrt(
      (halfHeight * Math.cos(-angle + Math.PI / 2)) ** 2 +
        (halfWidth * Math.sin(-angle + Math.PI / 2)) ** 2
    );

  return {
    x: (deltaX * Math.abs(deltaX)) / radiusX,
    y: (deltaY * Math.abs(deltaY)) / radiusY,
  };
}

/**
 * @param {Pen} pen
 * @param {number} [dt=1]
 * @param {Pen} [out=pen]
 * @returns {Pen} out
 */
function integrate(pen, dt = 1, out = pen) {
  out.pos.x = pen.pos.x + pen.vel.x * dt + 0.5 * pen.accel.x * dt * dt;
  out.pos.y = pen.pos.y + pen.vel.y * dt + 0.5 * pen.accel.y * dt * dt;

  const newAccelX = pen.accel.x + pen.jerk.x * dt;
  const newAccelY = pen.accel.y + pen.jerk.y * dt;

  const avgAccelX = 0.5 * (pen.accel.x + newAccelX);
  const avgAccelY = 0.5 * (pen.accel.y + newAccelY);

  out.vel.x = pen.vel.x + avgAccelX * dt;
  out.vel.y = pen.vel.y + avgAccelY * dt;

  out.accel.x = newAccelX;
  out.accel.y = newAccelY;

  out.t = pen.t + dt;

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
