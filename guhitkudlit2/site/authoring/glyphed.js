import { html } from "../components/html.js";
import { action } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { NodeEditor } from "./node-editor.js";

export function createGlyphed({ nodes, selectOnlyNode }) {
  const width = 800;
  const height = 800;

  const onGrabNode = action((node) => {
    if (!node.selected) {
      selectOnlyNode(node);
    }
  });

  const NodeEditors = observer(({ nodes }) =>
    nodes.map(
      (node) =>
        html`<${NodeEditor}
          key=${node.id}
          node=${node}
          onGrabNode=${onGrabNode}
        />`
    )
  );

  return () =>
    html`<${Glyphed}
      width=${width}
      height=${height}
      nodeEditors=${html`<${NodeEditors} nodes=${nodes} />`}
    />`;
}

export function Glyphed({ width, height, nodeEditors }) {
  return html` <style id=${Glyphed.name}>
      .glyphed {
        position: relative;
        background-image: linear-gradient(to right, #eee 1px, transparent 1px),
          linear-gradient(to bottom, #eee 1px, transparent 1px);
        background-color: white;
        background-size: 1cm 1cm;
        background-position: center center;
        box-shadow: var(--shadow-l);
      }
    </style>
    <div class="glyphed" style=${{ width, height }}>${nodeEditors}</div>`;
}
