import { render } from "../lib/htm-preact.js";
import { html } from "../components/html.js";
import { AppLogo } from "../app/logo.js";
import { createGlyphed } from "./glyphed.js";
import {
  makeAutoObservable,
  observable,
  runInAction,
} from "../lib/mobx.js";
import { createToolbar } from "./toolbar.js";
import { createActions } from "./actions.js";
import { loadAppDataFromStorage, saveAppDataToStorage } from "./storage.js";
import { createGlyphPreview } from "./glyph-preview.js";

/**
 * @type {{
 *  glyphs: Array<import("./glyphed.js").Glyph>,
 *  selectedGlyph: import("./glyphed.js").Glyph | null,
 *  previewEnabled: boolean,
 * }}
 */
const appState = makeAutoObservable({
  glyphs: observable.array([], { deep: false }),
  selectedGlyph: null,
  previewEnabled: true,
});

const {
  addGlyph,
  deleteGlyph,
  selectGlyph,
  addNode,
  connectNodes,
  deleteSelected,
  selectItems,
  deselectAll,
} = createActions({ appState, createGlyph, createNode, createEdge });

function init() {
  const appData = loadAppDataFromStorage();
  if (appData) {
    applyAppDataFromObject(appData);
  }
}

function saveAppData() {
  saveAppDataToStorage({ glyphs: appState.glyphs });
}

async function importGlyphs() {
  try {
    const json = await uploadFileAsString();
    if (json) {
      applyAppDataFromObject({ glyphs: JSON.parse(json) });
    } else {
      throw new Error("No data");
    }
  } catch (e) {
    alert(e);
  }
}

function exportGlyphs() {
  const glyphs = appState.glyphs.map((glyph) => ({
    name: glyph.name,
    nodes: glyph.nodes.map(({ id, x, y, controlX, controlY, width }) => ({
      id,
      x,
      y,
      controlX,
      controlY,
      width,
    })),
    edges: glyph.edges.map(({ nodes }) => ({ nodes })),
  }));
  downloadString(JSON.stringify(glyphs), "text/json", "export.json");
}

const Toolbar = createToolbar({
  appState,
  saveAppData,
  importGlyphs,
  exportGlyphs,
  addGlyph,
  deleteGlyph,
  selectGlyph,
  addNode,
  connectNodes,
  deleteSelected,
  selectItems,
  deselectAll,
});
const GlyphPreview = createGlyphPreview({ appState });
const Glyphed = createGlyphed({ appState, selectItems, GlyphPreview });

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

init();
render(html`<${Authoring} />`, document.body);

function createGlyph(name = "a", nodes = [], edges = []) {
  return makeAutoObservable({
    name,
    nodes: observable.array(nodes, { deep: false }),
    edges: observable.array(edges, { deep: false }),
  });
}

function createNode({ id, x, y, controlX, controlY, width }) {
  return makeAutoObservable({
    id,
    x,
    y,
    controlX: controlX,
    controlY: controlY,
    width: width,
    selected: false,
  });
}

function createEdge(id, selectedIDs) {
  return makeAutoObservable({
    id,
    nodes: selectedIDs,
    selected: false,
  });
}

function applyAppDataFromObject(appData) {
  runInAction(() => {
    appState.glyphs.replace(
      appData.glyphs.map((glyph) =>
        createGlyph(
          glyph.name,
          glyph.nodes.map((node) => createNode(node)),
          glyph.edges.map((edge, i) => createEdge(i, edge.nodes))
        )
      )
    );
  });
}

function uploadFileAsString() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = () => {
      const file = input.files[0];
      if (!file) {
        reject("No file selected");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };

    input.click();
  });
}

function downloadString(text, fileType, fileName) {
  const blob = new Blob([text], { type: fileType });
  const a = document.createElement("a");
  a.download = fileName;
  a.href = URL.createObjectURL(blob);
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => void URL.revokeObjectURL(a.href), 1500);
}
