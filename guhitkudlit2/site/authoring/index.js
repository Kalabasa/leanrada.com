import { render } from "../lib/htm-preact.js";
import { html } from "../components/html.js";
import { AppLogo } from "../app/logo.js";
import { createGlyphed } from "./glyphed.js";
import { action, observable } from "../lib/mobx.js";
import { createToolbar } from "./toolbar.js";

/** @type {import("./node-editor.js").Node[]} */
const nodes = observable.array([], { deep: false });

const selectOnlyNode = action((node) => {
  nodes.forEach((node) => (node.selected = false));
  node.selected = true;
});

const Toolbar = createToolbar({ nodes });
const Glyphed = createGlyphed({ nodes, selectOnlyNode });

export function Authoring() {
  return html`
    <style id=${Authoring.name}>
      .authoring {
        background: var(--color-bg-darker);
      }
      .authoringLayout {
        display: grid;
        grid-template-rows: min-content minmax(0, 1fr);
        grid-template-columns: min-content minmax(0, 1fr);
        grid-template-areas:
          "logo editor"
          "tools editor";
        grid-gap: var(--size-m);
        padding: var(--size-m) var(--size-m) 0;
        height: 100vh;
        overflow: hidden;
      }
      .authoringLogo {
        grid-area: logo;
        position: relative;
        left: calc(var(--size-s) * -1);
        top: calc(var(--size-s) * -1);
        justify-self: start;
        align-self: start;
        z-index: 1;
      }
      .authoringGlyphEditor {
        grid-area: editor;
        padding: var(--size-l);
      }
      .authoringTools {
        grid-area: tools;
      }
    </style>
    <div class="authoring authoringLayout">
      <div class="authoringLogo">
        <${AppLogo} />
      </div>
      <main class="authoringGlyphEditor">
        <${Glyphed} />
      </main>
      <aside class="authoringTools">
        <${Toolbar} />
      </aside>
    </div>
  `;
}

render(html`<${Authoring} />`, document.body);
