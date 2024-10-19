/**
 * @typedef {{
 *  vertices: Vertex[]
 * }} Stroke
 *
 * @typedef {{
 *  x: number,
 *  y: number,
 * }} Vertex
 */

/**
 * Path is a collection of strokes.
 *
 * @param {Array<import("../authoring/node-editor.js").Node>} nodes
 * @param {Array<import("../authoring/edge-editor.js").Edge>} edges
 * @return {Stroke[]}
 */
export function generatePath(nodes, edges) {
  const components = findComponents(nodes, edges);
  return components.map((component) => {
    const sequence = toNodeSequence(component, edges);
    const vertices = generateStroke(Array.from(sequence));
    return { vertices: Array.from(vertices) };
  });
}

/**
 * A stroke is one contiguous painting motion.
 *
 * @param {Array<import("../authoring/node-editor.js").Node>} sequence
 * @yield {Vertex}
 */
function* generateStroke(sequence) {
  if (!sequence.length) {
    return;
  }

  const pen = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
  };

  // test simple trajectory generation
  let limit = 1000;
  pen.position.x = sequence[0].x;
  pen.position.y = sequence[0].y;
  let nextIndex = 1;
  while (nextIndex < sequence.length) {
    const nextNode = sequence[nextIndex];

    const deltaX = nextNode.x - pen.position.x;
    const deltaY = nextNode.y - pen.position.y;

    pen.acceleration.x += deltaX * 0.1;
    pen.acceleration.y += deltaY * 0.1;
    pen.acceleration.y *= 0.4;
    pen.acceleration.x *= 0.4;
    pen.velocity.y *= 0.8;
    pen.velocity.x *= 0.8;
    integrate(pen);

    yield { ...pen.position };

    if (Math.hypot(deltaX, deltaY) < nextNode.width * 0.5) {
      nextIndex++;
    }

    if (limit-- <= 0) {
      break;
    }
  }
}

function integrate(pen) {
  pen.velocity.x += pen.acceleration.x;
  pen.velocity.y += pen.acceleration.y;
  pen.position.x += pen.velocity.x;
  pen.position.y += pen.velocity.y;
}

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
