import "./app/logo.js";
import { AppPanelGroup } from "./app/panel-group.js";
import { createCanvas } from "./canvas/canvas.js";
import { html } from "./components/html.js";
import { render } from "./lib/htm-preact.js";
import { createTransliterationForm } from "./transliteration/form.js";
import { observable, when } from "./lib/mobx.js";
import { createFileControls } from "./file/controls.js";
import { createLayoutControls } from "./layout/controls.js";
import { createSpellingControls } from "./spelling/controls.js";
import { createStyleControls } from "./style/controls.js";
import { ColorStyleFilters } from "./style/color-styles.js";
import { createPresetControls } from "./presets/controls.js";

const { SpellingControls, viramaStyle, separateRa } = createSpellingControls();
const { TransliterationForm, inputText, inputTextWrapperRef, baybayinUnits } =
  createTransliterationForm(viramaStyle, separateRa);
const { StyleControls, colorStyle, painterName } = createStyleControls();
const { LayoutControls, arrangement, density } = createLayoutControls();
const { PresetControls } = createPresetControls({
  painterName,
  colorStyle,
  viramaStyle,
  arrangement,
  density,
});
const { Canvas, canvasRef } = createCanvas(
  baybayinUnits,
  colorStyle,
  async (config) => {
    if (config.viramaStyle !== undefined) viramaStyle.set(config.viramaStyle);
    if (config.separateRa !== undefined) separateRa.set(config.separateRa);
    if (config.arrangement !== undefined) arrangement.set(config.arrangement);
    inputText.set(config.text);

    await document.startViewTransition(() => {
      inputTextWrapperRef.current?.style.setProperty(
        "view-transition-name",
        config.sourceElement.style.viewTransitionName,
      );
      config.sourceElement.style.removeProperty("view-transition-name");
    }).finished;

    // inputTextWrapperRef.current?.querySelector("input").focus();
  },
);
const calligraphyInputs = {
  baybayinUnits,
  viramaStyle,
  arrangement,
  density,
  painterName,
};
const calligraphyComplete = observable.box(false);
const { FileControls } = createFileControls(
  canvasRef,
  inputText,
  calligraphyInputs,
  colorStyle,
  calligraphyComplete,
);

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
    installCalligraphy(calligraphyInputs, canvasRef, onProgress);
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
        height: 100vh;
        overflow: hidden;
      }
      .appLogo {
        grid-area: canvas;
        position: relative;
        left: var(--size-s);
        top: var(--size-s);
        justify-self: start;
        align-self: start;
        z-index: 1;
      }
      .appMenu {
        grid-area: canvas;
        position: relative;
        right: var(--size-s);
        top: var(--size-s);
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
        padding: 0 var(--size-m);
        overflow: auto;
        scroll-snap-type: x mandatory;
        container-type: inline-size;
      }
      ::view-transition-old(introConfig) {
        height: 100%;
      }
    </style>
    <div class="app appDesktopLayout">
      <div class="appLogo">
        <app-logo></app-logo>
      </div>
      <nav class="appMenu">menu</nav>
      <main class="appCanvas">
        <${Canvas} />
      </main>
      <div class="appPanelGroupArea">
        <${AppPanelGroup}
          panels=${[
            { title: "Text", content: html`<${TransliterationForm} />` },
            { spacer: true },
            {
              title: "Theme",
              content: html`<${PresetControls}
                baybayinUnits=${baybayinUnits}
              />`,
            },
            {
              title: "Spelling",
              content: html`<${SpellingControls}
                inputText=${inputText}
                baybayinUnits=${baybayinUnits}
              />`,
            },
            {
              title: "Style",
              content: html`<${StyleControls}
                baybayinUnits=${baybayinUnits}
              />`,
            },
            {
              title: "Layout",
              content: html`<${LayoutControls}
                baybayinUnits=${baybayinUnits}
              />`,
            },
            { title: "File", content: html`<${FileControls} />` },
          ]}
        />
      </div>
      <${ColorStyleFilters} />
    </div>
  `;
}

render(html`<${Index} />`, document.body);
