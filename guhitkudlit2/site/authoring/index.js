import { render } from "../lib/htm-preact.js";
import { html } from "../components/html.js";
import { AppLogo } from "../app/logo.js";
import { createGlyphed } from "./glyphed.js";
import {
  autorun,
  makeAutoObservable,
  observable,
  runInAction,
} from "../lib/mobx.js";
import { createToolbar } from "./toolbar.js";
import { createActions } from "./actions.js";
import { loadAppDataFromStorage, saveAppDataToStorage } from "./storage.js";

/**
 * @typedef {{
 *  name: string;
 *  nodes: import("./node-editor.js").Node[];
 *  edges: import("./edge-editor.js").Edge[];
 * }} Glyph
 * @type {{
 *  glyphs: Array<Glyph>,
 *  selectedGlyph: Glyph | null,
 * }}
 */
const appState = makeAutoObservable({
  glyphs: observable.array([], { deep: false }),
  selectedGlyph: null,
});

const {
  addGlyph,
  selectGlyph,
  addNode,
  connectNodes,
  deleteSelected,
  selectItems,
  deselectAll,
} = createActions({ appState, createGlyph });

function createGlyph(name = "a", nodes = [], edges = []) {
  return makeAutoObservable({
    name,
    nodes: observable.array(nodes, { deep: false }),
    edges: observable.array(edges, { deep: false }),
  });
}

function loadAppData() {
  const appData = loadAppDataFromStorage();
  if (appData) {
    runInAction(() => {
      appState.glyphs.replace(
        appData.glyphs.map((glyph) =>
          createGlyph(
            glyph.name,
            glyph.nodes.map((node) => makeAutoObservable(node)),
            glyph.edges.map((edge) => makeAutoObservable(edge))
          )
        )
      );
    });
  }
}

function saveAppData() {
  saveAppDataToStorage({ glyphs: appState.glyphs });
}

function importAppData() {
  prompt("Enter code");
}

function exportAppData() {
  alert("Code:");
}

const Toolbar = createToolbar({
  appState,
  saveAppData,
  importAppData,
  exportAppData,
  addGlyph,
  selectGlyph,
  addNode,
  connectNodes,
  deleteSelected,
  selectItems,
  deselectAll,
});
const Glyphed = createGlyphed({ appState, selectItems });

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

loadAppData();
render(html`<${Authoring} />`, document.body);
