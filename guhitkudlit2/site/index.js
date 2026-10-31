/*
  GuhitKudlit
  Copyright (C) 2023-2026  Lean Rada

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { createAppMenuButton } from "./app/menu-button.js";
import { createPanelGroup } from "./app/panel-group.js";
import { createCanvas } from "./canvas/canvas.js";
import { html } from "./components/html.js";
import { render } from "./lib/htm-preact.js";
import { createTransliterationForm } from "./transliteration/form.js";
import { observable, runInAction, when } from "./lib/mobx.js";
import { createFileControls } from "./file/controls.js";
import { createLayoutControls } from "./layout/controls.js";
import { createSpellingControls } from "./spelling/controls.js";
import { createStyleControls } from "./style/controls.js";
import { flushObservers, observer } from "./util/observer.js";
import { classes } from "./util/classes.js";
import { ColorStyleFilters } from "./style/color-styles.js";
import { createPresetControls } from "./presets/controls.js";

const { AppPanelGroup, activatePanel } = createPanelGroup();
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

const calligraphyComplete = observable.box(false);
const showPlaceholder = observable.box(inputText.get().length === 0);
const { Canvas, canvasRef } = createCanvas(
  colorStyle,
  showPlaceholder,
  async (config) => {
    inputTextWrapperRef.current?.scrollIntoView({ behavior: "smooth" });

    await hidePlaceholder(() => {
      for (const [key, input] of Object.entries({
        painterName,
        colorStyle,
        viramaStyle,
        separateRa,
        arrangement,
        density,
      })) {
        if (config[key] !== undefined) input.set(config[key]);
      }
      inputTextWrapperRef.current?.style.setProperty(
        "view-transition-name",
        config.sourceElement.style.viewTransitionName,
      );
      config.sourceElement.style.removeProperty("view-transition-name");
      const destInput = inputTextWrapperRef.current?.querySelector("input");
      if (destInput) destInput.value = config.text;
    });

    inputText.set(config.text);
    setTimeout(() => {
      if (!matchMedia("(pointer: fine)").matches) return;
      inputTextWrapperRef.current?.querySelector("input").focus();
    }, 125);

    const interaction = new AbortController();
    const lopts = {
      once: true,
      capture: true,
      signal: interaction.signal,
    };
    window.addEventListener("pointerdown", () => interaction.abort(), lopts);
    window.addEventListener("scroll", () => interaction.abort(), lopts);

    when(
      () => calligraphyComplete.get(),
      () => {
        if (interaction.signal.aborted) return;
        interaction.abort();
        activatePanel(/* File */ 5);
      },
    );
  },
);
async function hidePlaceholder(updateDom) {
  const run = () => {
    showPlaceholder.set(false);
    updateDom();
  };

  if (document.startViewTransition) {
    await document.startViewTransition(async () => {
      run();
      flushObservers();
      await new Promise((resolve) => setTimeout(resolve));
    }).finished;
  } else {
    run();
  }
}

const calligraphyInputs = {
  baybayinUnits,
  viramaStyle,
  arrangement,
  density,
  painterName,
};
const { FileControls, saveCanvas } = createFileControls(
  canvasRef,
  inputText,
  calligraphyInputs,
  colorStyle,
  calligraphyComplete,
);
const { AppMenuButton } = createAppMenuButton(
  inputText,
  calligraphyComplete,
  resetApp,
  saveCanvas,
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

const appLogoRef = { current: null };
const Logo = observer(
  () =>
    html`<a href=${location.pathname} onClick=${onLogoClick}
      ><img
        src="app/logo.svg"
        alt="GuhitKudlit"
        ref=${appLogoRef}
        style=${{ opacity: showPlaceholder.get() ? 0 : 1 }}
    /></a>`,
);

function onLogoClick(event) {
  event.preventDefault();
  resetApp();
}

function resetApp() {
  runInAction(() => {
    inputText.set("");
    showPlaceholder.set(true);
  });
}

const PanelGroupArea = observer(
  ({ children }) => html`
    <div
      class=${classes(
        "appPanelGroupArea",
        !showPlaceholder.get() && "appPanelGroupAreaShown",
      )}
      inert=${showPlaceholder.get()}
    >
      <div class="appPanelGroupClip">${children}</div>
    </div>
  `,
);

export function Index() {
  return html`
    <style id=${Index.name}>
      .app {
        background: url("bgnoise.png"), var(--color-bg-darker);
        display: grid;
        grid-template-rows: minmax(0, 1fr) min-content;
        grid-template-columns: 1fr;
        grid-template-areas:
          "canvas"
          "panels";
        grid-gap: var(--size-m);
        height: 100vh;
        height: 100svh;
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
        display: grid;
        grid-template-rows: 0fr;
      }
      .appPanelGroupAreaShown {
        grid-template-rows: 1fr;
      }
      .appPanelGroupClip {
        min-height: 0;
        overflow: hidden;
      }
      .appPanelGroupScroll {
        padding: 0 var(--size-m);
        overflow: auto;
        scroll-snap-type: x mandatory;
        container-type: inline-size;
      }
      @media (max-width: 750px) {
        .app {
          gap: var(--size-xs);
        }
        .appCanvas {
          padding: var(--size-m) var(--size-xs) var(--size-xs);
        }
        .appPanelGroupScroll {
          padding: 0 var(--size-xs);
        }
      }
      ::view-transition-group(*) {
        animation-duration: 0.2s;
      }
      ::view-transition-group(introConfig) {
        animation-duration: 0.7s;
        animation-delay: 0.1s;
        animation-timing-function: cubic-bezier(1, 0, 0.4, 1);
      }
      ::view-transition-group(logo) {
        animation-duration: 0.8s;
      }
      ::view-transition-group(canvas),
      ::view-transition-group(appPanelGroup) {
        animation-duration: 0.8s;
        animation-timing-function: cubic-bezier(0.7, 0, 0.7, 1);
      }
      ::view-transition-group(introConfig) {
        z-index: 1;
      }
      ::view-transition-old(introConfig) {
        height: 100%;
      }
    </style>
    <div class="app">
      <div class="appLogo">
        <${Logo} />
      </div>
      <nav class="appMenu">
        <${AppMenuButton} />
      </nav>
      <main class="appCanvas">
        <${Canvas} />
      </main>
      <${PanelGroupArea}>
        <div class="appPanelGroupScroll">
          <${AppPanelGroup}
            panels=${[
              { title: "Text", content: html`<${TransliterationForm} />` },
              { spacer: true },
              {
                title: "Presets",
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
      <//>
      <${ColorStyleFilters} />
    </div>
  `;
}

render(html`<${Index} />`, document.body);
