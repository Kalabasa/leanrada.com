import { Button, Input } from "../components/form.js";
import { html } from "../components/html.js";
import { useMemo } from "../lib/htm-preact.js";
import { action } from "../lib/mobx.js";
import { observer } from "../util/observer.js";

export function createToolbar({ nodes, edges, createNode, createEdge }) {
  const addNode = action(() => {
    let x = 100;
    let y = 100;
    while (nodes.some((node) => node.x === x && node.y === y)) {
      x += 25;
      y += 25;
    }
    nodes.push(createNode(x, y));
  });

  const deleteSelectedNodes = action(() => {
    nodes.replace(nodes.filter((node) => !node.selected));
  });

  const deselectAll = action(() => {
    nodes.forEach((node) => (node.selected = false));
    edges.forEach((edge) => (edge.selected = false));
  });

  const connectNodes = action(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length !== 2) {
      alert("Select exactly 2 nodes to connect");
      return;
    }
    edges.push(createEdge(...selectedNodes));
  });

  return () =>
    html`<${Toolbar}
      nodes=${nodes}
      edges=${edges}
      onClickDeselect=${deselectAll}
      onClickAddNode=${addNode}
      onClickDeleteNode=${deleteSelectedNodes}
      onClickConnect=${connectNodes}
      onClickDeleteEdge=${console.log}
    />`;
}

export function Toolbar({
  nodes,
  edges,
  onClickDeselect,
  onClickAddNode,
  onClickDeleteNode,
  onClickConnect,
  onClickDeleteEdge,
}) {
  return html`
    <style id=${Toolbar.name}>
      .authoringToolbar {
        min-width: 400px;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: var(--size-xs);
      }
      .authoringToolbarList {
        min-height: 200px;
        overflow: auto;
      }
    </style>
    <div class="authoringToolbar">
      <${Button} onClick=${onClickDeselect}>Deselect all<//>
      <${Button} onClick=${onClickAddNode}>Add node<//>
      <${Button} onClick=${onClickDeleteNode}>Delete node(s)<//>
      <${ItemSelector} items=${nodes} OptionComponent=${NodeOption} />
      <${Button} onClick=${onClickConnect}>Connect nodes<//>
      <${Button} onClick=${onClickDeleteEdge}>Delete edge(s)<//>
      <${ItemSelector} items=${edges} OptionComponent=${EdgeOption} />
    </div>
  `;
}

/**
 * @param {object} props
 * @param {Array<{ id, selected: boolean }>} props.items
 */
const ItemSelector = observer(({ items, OptionComponent }) => {
  const onChangeSelect = action((event) => {
    const selectedIDs = Array.from(event.currentTarget.selectedOptions).map(
      (option) => Number(option.value)
    );
    items.forEach((item) => {
      const selected = selectedIDs.includes(item.id);
      if (item.selected !== selected) {
        item.selected = selected;
      }
    });
  });

  return html`
    <${Input}
      class="authoringToolbarList"
      tag="select"
      multiple
      onChange=${onChangeSelect}
    >
      ${items.map(
        (item) => html`<${OptionComponent} key=${item.id} item=${item} />`
      )}
    <//>
  `;
});

/**
 * @param {object} props
 * @param {import("./node-editor.js").Node[]} props.item
 */
const NodeOption = observer(
  ({ item }) => html`<option value=${item.id}>
    ${selectionIndicator(item.selected)}Node${item.id}
  </option>`
);

const EdgeOption = observer(
  ({ item }) => html`<option value=${item.id}>
    ${selectionIndicator(item.selected)}Edge${item.id}
    [${item.nodes.map((node) => node.id).join("-")}]
  </option>`
);

function selectionIndicator(selected) {
  return selected ? "*" : "";
}
