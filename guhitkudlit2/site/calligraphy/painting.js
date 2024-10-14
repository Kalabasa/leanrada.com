/**
 * @param {Array<import("../authoring/glyphed.js").Glyph>} glyphs
 */
export function* paintStrokes(glyphs) {
  for (const glyph of glyphs) {
    yield* paintStrokesByNodes(glyph.nodes, glyph.edges);
  }
}
/**
 * @param {Array<import("../authoring/node-editor.js").Node>} nodes
 * @param {Array<import("../authoring/edge-editor.js").Edge>} edges
 */
function* paintStrokesByNodes(nodes, edges) {
  const getNodeById = getNodeByIDFrom(nodes);
  const nodeOrder = nodes.slice().sort((a, b) => a.y - b.y);
  console.log(nodeOrder);
}

function getNodeByIDFrom(nodes) {
  const dict = {};
  for (const node of nodes) {
    dict[node.id] = node;
  }
  return (id) => dict[id];
}
