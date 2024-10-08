import { Button, Input } from "../components/form.js";
import { html } from "../components/html.js";
import { useMemo, useRef } from "../lib/htm-preact.js";
import { action, makeAutoObservable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";

export function createToolbar({ nodes }) {
  const addNode = action(() => {
    let x = 100;
    let y = 100;
    while (nodes.some((node) => node.x === x && node.y === y)) {
      x += 25;
      y += 25;
    }

    let id = 0;
    while (nodes.some((node) => node.id === id)) {
      id++;
    }

    nodes.push(
      makeAutoObservable({
        id,
        x,
        y,
        controlX: x + 50,
        controlY: y,
        width: 100,
        selected: false,
      })
    );
    assertIDs(nodes);
  });

  const deleteSelectedNodes = action(() => {
    nodes.replace(nodes.filter((node) => !node.selected));
    assertIDs(nodes);
  });

  const deselectAllNodes = action(() => {
    nodes.forEach((node) => (node.selected = false));
  });

  return () =>
    html`<${Toolbar}
      nodes=${nodes}
      onClickAddNode=${addNode}
      onClickDeleteNode=${deleteSelectedNodes}
      onClickDeselect=${deselectAllNodes}
    />`;
}

function assertIDs(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].id === nodes[j].id) {
        console.error("Debug info:", nodes[i], nodes[j]);
        throw new Error(`Duplicate IDs at indices ${i} and ${j}!`);
      }
    }
  }
}

export function Toolbar({
  nodes,
  onClickAddNode,
  onClickDeleteNode,
  onClickDeselect,
}) {
  const onChangeSelect = useMemo(
    () =>
      action((values) => {
        const selectedIDs = Array.from(event.currentTarget.selectedOptions).map(
          (option) => Number(option.value)
        );

        nodes.forEach((node) => {
          const selected = selectedIDs.includes(node.id);
          if (node.selected !== selected) {
            node.selected = selected;
          }
        });
      }),
    [nodes]
  );

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
      <${Input}
        class="authoringToolbarList"
        tag="select"
        multiple
        value=${nodes
          .map((node) => (node.selected ? String(node.id) : null))
          .filter((id) => id !== null)}
        onChange=${onChangeSelect}
      >
        <${NodeOptions} nodes=${nodes} />
      <//>
    </div>
  `;
}

const NodeOptions = observer(({ nodes }) =>
  nodes.map((node) => html`<${NodeOption} key=${node.id} node=${node} />`)
);

const NodeOption = observer(
  ({ node }) => html`<option value=${node.id}>
    ${node.id} ${node.selected && "(selected)"}
  </option>`
);
