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

export function createGlyphed({ appState, selectItems, GlyphPreview }) {
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
        preview=${html`<${GlyphPreview} width=${width} height=${height} />`}
        edgeEditors=${html`<${EdgeEditors}
          key=${"edgeEditors." + appState.selectedGlyph?.name}
          edges=${appState.selectedGlyph?.edges ?? []}
        />`}
        nodeEditors=${html`<${NodeEditors}
          key=${"nodeEditors." + appState.selectedGlyph?.name}
          nodes=${appState.selectedGlyph?.nodes ?? []}
        />`}
      />`
  );
}

export function Glyphed({ width, height, preview, edgeEditors, nodeEditors }) {
  return html` <style id=${Glyphed.name}>
      .glyphed {
        display: grid;
        place-content: start;
        position: relative;
        background-image: linear-gradient(to right, #eee 1px, transparent 1px),
          linear-gradient(to bottom, #eee 1px, transparent 1px);
        background-color: white;
        background-size: 6.25% 6.25%;
        background-position: 0 0;
        box-shadow: var(--shadow-l);
      }
      .glyphed::before {
        content: "";
        position: absolute;
        background-image: linear-gradient(
            to right,
            transparent 25%,
            #ccc 25%,
            #ccc calc(25% + 1px),
            transparent calc(25% + 1px),
            transparent 50%,
            #999 50%,
            #999 calc(50% + 1px),
            transparent calc(50% + 1px),
            transparent 75%,
            #ccc 75%,
            #ccc calc(75% + 1px),
            transparent calc(75% + 1px)
          ),
          linear-gradient(
            to bottom,
            transparent 25%,
            #ccf 25%,
            #ccf calc(25% + 1px),
            transparent calc(25% + 1px),
            transparent 50%,
            #fcc 50%,
            #fcc calc(50% + 1px),
            transparent calc(50% + 1px),
            transparent 75%,
            #ccf 75%,
            #ccf calc(75% + 1px),
            transparent calc(75% + 1px)
          );
        inset: 0;
      }
    </style>
    <div class="glyphed" style=${{ width, height }}>
      ${edgeEditors}${nodeEditors}${preview}
    </div>`;
}
