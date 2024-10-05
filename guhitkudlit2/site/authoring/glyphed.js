import { html } from "../components/html.js";
import { observer } from "../util/observer.js";
import { NodeEditor } from "./node-editor.js";

export function createGlyphed({ nodes }) {
  const width = 800;
  const height = 800;

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

const NodeEditors = observer(({ nodes }) =>
  nodes.map((node, index) => html`<${NodeEditor} key=${index} node=${node} />`)
);
