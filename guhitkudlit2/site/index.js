import { AppLogo } from "./app/logo.js";
import { AppPanelGroup } from "./app/panel-group.js";
import { createCanvas } from "./canvas/canvas.js";
import { html } from "./components/html.js";
import { render } from "./lib/htm-preact.js";
import { createTransliterationForm } from "./transliteration/form.js";
import { observable, when } from "./lib/mobx.js";
import { createFileControls } from "./file/controls.js";
import { createSpellingControls } from "./spelling/controls.js";

const { SpellingControls, viramaStyle, separateRa, precolonial } = createSpellingControls();
const { TransliterationForm, inputText, baybayinUnits } = createTransliterationForm(viramaStyle, separateRa, precolonial);
const { Canvas, canvasRef } = createCanvas(baybayinUnits);
const calligraphyComplete = observable.box(false);
const { FileControls } = createFileControls(canvasRef, inputText, baybayinUnits, viramaStyle, calligraphyComplete);

when(
  () => baybayinUnits.get().length > 0,
  async () => {
    const { installCalligraphy } = await import("./calligraphy/calligraphy.js");
    const onProgress = (progress) => {
      if (progress === "start") {
        calligraphyComplete.set(false);
      } else if (progress === "complete") {
        calligraphyComplete.set(true);
      }
    };
    installCalligraphy(baybayinUnits, viramaStyle, canvasRef, onProgress);
  },
);

export function Index() {
  return html`
    <style id=${Index.name}>
      .app {
        background: var(--color-bg-darker);
      }
      .appDesktopLayout {
        display: grid;
        grid-template-rows: minmax(0, 1fr) min-content;
        grid-template-columns: 1fr;
        grid-template-areas:
          "canvas"
          "panels";
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
        align-self: start;
        z-index: 1;
      }
      .appMenu {
        grid-area: canvas;
        justify-self: end;
        align-self: start;
        z-index: 2;
      }
      .appCanvas {
        grid-area: canvas;
        padding: var(--size-l);
      }
      .appPanelGroupArea {
        grid-area: panels;
      }
    </style>
    <div class="app appDesktopLayout">
      <div class="appLogo">
        <${AppLogo} />
      </div>
      <nav class="appMenu">menu</nav>
      <main class="appCanvas">
        <${Canvas} />
      </main>
      <div class="appPanelGroupArea">
        <${AppPanelGroup}
          panels=${[
            { title: html`<h2>Text</h2>`, content: html`<${TransliterationForm} />` },
            {
              title: html`<h2>Spelling</h2>`,
              content: html`<${SpellingControls}
                inputText=${inputText}
                baybayinUnits=${baybayinUnits}
              />`,
            },
            { title: html`<h2>File</h2>`, content: html`<${FileControls} />` },
          ]}
        />
      </div>
    </div>
  `;
}

render(html`<${Index} />`, document.body);
