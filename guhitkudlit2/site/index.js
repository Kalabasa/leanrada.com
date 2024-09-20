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
      .appLogo {
        grid-area: canvas;
        position: relative;
        left: calc(var(--size-s) * -1);
        top: calc(var(--size-s) * -1);
        justify-self: start;
        z-index: 1;
      }
      /* todo: Logo component */
      .appLogo > h1 {
        margin: 0;
        padding: 0.2em;
        width: 3.82em;
        border-radius: 0.09em;
        font-family: "Cubao Regular", sans-serif;
        font-size: 1.6em;
        line-height: 0.7em;
        font-weight: normal;
        background: #000;
      }
      /* todo: Logo component */
      .appLogo > h1 > div {
        background-image: linear-gradient(
          var(--color-green),
          var(--color-green) 35%,
          var(--color-bg) 35%,
          var(--color-bg) 55%,
          var(--color-orange) 55%,
          var(--color-orange)
        );
        color: transparent;
        background-clip: text;
      }
      /* todo: Logo component */
      .appLogo > h1 > div::first-line {
        font-family: "Cubao Wide", sans-serif;
        font-size: 0.84em;
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
      .appActionPanelArea {
        grid-area: action;
      }
    </style>
    <div class="app appDesktopLayout">
      <div class="appLogo">
        ${/* todo: Logo component */ ""}
        <h1>
          <div>Guhit<br />Kudlit</div>
        </h1>
      </div>
      <nav class="appMenu">menu</nav>
      <main class="appCanvas">canvas</main>
      <aside class="appInputPanelArea">
        <${AppPanel} title=${html`<h2>Text</h2>`}>text<//>
      </aside>
      <aside class="appStylePanelArea">
        <${AppPanel} title=${html`<h2>Style</h2>`}>style<//>
      </aside>
      <aside class="appActionPanelArea">
        <${AppPanel} title=${html`<h2>File</h2>`}>file<//>
      </aside>
    </div>
  `;
}

render(html`<${Index} />`, document.body);
