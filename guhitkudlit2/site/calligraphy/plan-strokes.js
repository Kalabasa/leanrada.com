/**
 * @typedef {{
 *  start: { x: number, y: number },
 *  end: { x: number, y: number },
 * }} Stroke
 */

/**
 * @param {Array<import("../authoring/node-editor.js").Node>} nodes
 * @param {Array<import("../authoring/edge-editor.js").Edge>} edges
 * @yields {Stroke}
 */
export function* planStrokes(nodes, edges) {
  const getNodeByID = getByIDFrom(nodes);
  const getEdgeByID = getByIDFrom(edges);

  const sortedEdges = edges.slice(); // todo: sort
  const queue = sortedEdges.map((edge) => ({
    edge,
    direction: 1,
  }));

  while (queue.length > 0) {
    const next = queue.shift();
    const node1 = getNodeByID(next.edge.nodes[0]);
    const node2 = getNodeByID(next.edge.nodes[1]);
    const start = { x: node1.x, y: node1.y };
    const end = { x: node2.x, y: node2.y };
    yield { start, end };
  }
}

function getByIDFrom(itemsWithIDs) {
  const dict = {};
  for (const item of itemsWithIDs) {
    dict[item.id] = item;
  }
  return (id) => dict[id];
}

/**
 * @param {Array<import("../authoring/edge-editor.js").Edge>} edges
 * @yields {number}
 */
function* getAdjacentNodeIDs(nodeID, edges) {
  for (const edge of edges) {
    if (edge.nodes[0] === nodeID) {
      yield edge.nodes[1];
    } else if (edge.nodes[1] === nodeID) {
      yield edge.nodes[0];
    }
  }
}
