import { html } from "../components/html.js";
import { action } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { EdgeEditor } from "./edge-editor.js";
import { NodeEditor } from "./node-editor.js";

export function createGlyphed({ nodes, edges, selectItems }) {
  const width = 800;
  const height = 800;

  const onGrabNode = action((node, event) => {
    selectItems([node.id], nodes, event.shiftKey);
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

  const onClickEdge = action((edge, event) => {
    selectItems([edge.id], edges, event.shiftKey);

  });

  const EdgeEditors = observer(({ edges }) =>
    edges.map(
      (edge) =>
        html`<${EdgeEditor}
          key=${edge.id}
          edge=${edge}
          onClickEdge=${onClickEdge}
        />`
    )
  );

  return () =>
    html`<${Glyphed}
      width=${width}
      height=${height}
      edgeEditors=${html`<${EdgeEditors} edges=${edges} />`}
      nodeEditors=${html`<${NodeEditors} nodes=${nodes} />`}
    />`;
}

export function Glyphed({ width, height, edgeEditors, nodeEditors }) {
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
    <div class="glyphed" style=${{ width, height }}>
      ${edgeEditors}${nodeEditors}
    </div>`;
}
