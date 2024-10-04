import { html } from "../components/html.js";
import { makeAutoObservable } from "../lib/mobx.js";
import { NodeEditor } from "./node-editor.js";

export function createGlyphed() {
  const width = 800;
  const height = 800;

  /** @type {import("./node-editor.js").Node[]} */
  const nodes = [
    makeAutoObservable({
      x: 200,
      y: 200,
      controlX: 250,
      controlY: 200,
      width: 50,
    }),
  ];

  return () =>
    html`<${Glyphed} width=${width} height=${height} nodes=${nodes} />`;
}

export function Glyphed({ width, height, nodes }) {
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
      ${nodes.map((node) => NodeEditor({ node }))}
    </div>`;
}


