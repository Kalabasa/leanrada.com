import { render } from "./lib/htm-preact.js";
import { html } from "./components/html.js";
import { AppPanel } from "./app/panel.js";

export function Index() {
  return html`
    <style>
      .app {
        background: var(--color-bg-darker);
      }
      .appDesktopLayout {
        display: grid;
        grid-template-rows: 1fr 1fr;
        grid-template-columns: repeat(3, 1fr);
        grid-template-areas:
          "canvas canvas canvas"
          "input style action";
        grid-gap: var(--size-m);
        padding: var(--size-m) var(--size-m) 0;
        height: 100vh;
        overflow: hidden;
      }
      .appCanvas {
        grid-area: canvas;
      }
      .appInputPanelArea {
        grid-area: input;
      }
      .appStylePanelArea {
        grid-area: style;
      }
      .appActionPanelArea {
        grid-area: action;
      }
    </style>
    <div class="app appDesktopLayout">
      <div class="appCanvas">canvas</div>
      <div class="appInputPanelArea">
        <${AppPanel} title=${html`<h2>Text</h2>`}>text<//>
      </div>
      <div class="appStylePanelArea">
        <${AppPanel} title=${html`<h2>Style</h2>`}>style<//>
      </div>
      <div class="appActionPanelArea">
        <${AppPanel} title=${html`<h2>File</h2>`}>file<//>
      </div>
    </div>
  `;
}

render(html`<${Index} />`, document.body);
