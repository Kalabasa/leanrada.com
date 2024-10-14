import { html } from "../components/html.js";
import { action } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { EdgeEditor } from "./edge-editor.js";
import { NodeEditor } from "./node-editor.js";

/**
 * @typedef {{
 *  name: string;
 *  nodes: import("./node-editor.js").Node[];
 *  edges: import("./edge-editor.js").Edge[];
 * }} Glyph
 */

export function createGlyphed({ appState, selectItems }) {
  const width = 800;
  const height = 800;

  const onGrabNode = action((node, event) => {
    selectItems([node.id], appState.selectedGlyph.nodes, event.shiftKey);
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

  const getNode = (id) =>
    appState.selectedGlyph.nodes.find((node) => node.id === id);

  const onClickEdge = action((edge, event) => {
    selectItems([edge.id], appState.selectedGlyph.edges, event.shiftKey);
  });

  const EdgeEditors = observer(({ edges }) =>
    edges.map(
      (edge) =>
        html`<${EdgeEditor}
          key=${edge.id}
          edge=${edge}
          getNode=${getNode}
          onClickEdge=${onClickEdge}
        />`
    )
  );

  return observer(
    () =>
      html`<${Glyphed}
        width=${width}
        height=${height}
        edgeEditors=${html`<${EdgeEditors}
          edges=${appState.selectedGlyph?.edges ?? []}
        />`}
        nodeEditors=${html`<${NodeEditors}
          nodes=${appState.selectedGlyph?.nodes ?? []}
        />`}
      />`
  );
}

export function Glyphed({ width, height, edgeEditors, nodeEditors }) {
  return html` <style id=${Glyphed.name}>
      .glyphed {
        position: relative;
        background-image: linear-gradient(to right, #eee 1px, transparent 1px),
          linear-gradient(to bottom, #eee 1px, transparent 1px);
        background-color: white;
        background-size: 1cm 1cm;
        background-position: calc(50% + 0.5cm) calc(50% + 0.5cm);
        box-shadow: var(--shadow-l);
      }
      .glyphed::before {
        content: "";
        position: absolute;
        background-image: linear-gradient(
            to right,
            transparent 50%,
            #ccc 50%,
            #ccc calc(50% + 1px),
            transparent calc(50% + 1px)
          ),
          linear-gradient(
            to bottom,
            transparent 50%,
            #ccc 50%,
            #ccc calc(50% + 1px),
            transparent calc(50% + 1px)
          );
        inset: 0;
      }
    </style>
    <div class="glyphed" style=${{ width, height }}>
      ${edgeEditors}${nodeEditors}
    </div>`;
}
