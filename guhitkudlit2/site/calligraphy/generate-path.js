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
 * @param {Array<import("../authoring/node-editor.js").Node>} nodes
 * @param {Array<import("../authoring/edge-editor.js").Edge>} edges
 * @return {Stroke[]}
 */
export function generatePath(nodes, edges) {
  const components = findComponents(nodes, edges);
  return components.map((component) => {
    const sequence = toNodeSequence(component, edges);
    const vertices = Array.from(
      sequence.map((node) => ({ x: node.x, y: node.y }))
    );
    return { vertices };
  });
}

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
