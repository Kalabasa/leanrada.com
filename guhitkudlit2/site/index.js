import { render } from "./lib/htm-preact.js";
import { html } from "./components/html.js";
import { AppPanel } from "./app/panel.js";
import { AppLogo } from "./app/logo.js";
import { TransliterationForm } from "./transliteration/form.js";

export function Index() {
  return html`
    <style id=${Index.name}>
      .app {
        background: var(--color-bg-darker);
      }
      .appDesktopLayout {
        display: grid;
        grid-template-rows: 1fr 1fr;
        grid-template-columns: repeat(3, 1fr);
        grid-template-areas:
          "canvas canvas canvas"
          "input style file";
        grid-gap: var(--size-m);
        padding: var(--size-m) var(--size-m) 0;
        height: 100vh;
        overflow: hidden;
      }
      .appLogo {
        grid-area: canvas;
        position: relative;
        left: calc(var(--size-s) * -1);
        top: calc(var(--size-s) * -1);
        justify-self: start;
        z-index: 1;
      }
      .appMenu {
        grid-area: canvas;
        justify-self: end;
        z-index: 2;
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
      .appFilePanelArea {
        grid-area: file;
      }
    </style>
    <div class="app appDesktopLayout">
      <div class="appLogo">
        <${AppLogo} />
      </div>
      <nav class="appMenu">menu</nav>
      <main class="appCanvas">canvas</main>
      <aside class="appInputPanelArea">
        <${AppPanel} title=${html`<h2>Text</h2>`}>
          <${TransliterationForm} />
        <//>
      </aside>
      <aside class="appStylePanelArea">
        <${AppPanel} title=${html`<h2>Style</h2>`}>style<//>
      </aside>
      <aside class="appFilePanelArea">
        <${AppPanel} title=${html`<h2>File</h2>`}>file<//>
      </aside>
    </div>
  `;
}

render(html`<${Index} />`, document.body);
