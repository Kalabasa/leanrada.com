import { Button, Input } from "../components/form.js";
import { html } from "../components/html.js";
import { useState } from "../lib/htm-preact.js";
import { action } from "../lib/mobx.js";
import { convertToUnicode } from "../transliteration/unicode.mjs";
import { LabelText } from "../typography/text.js";
import { observer } from "../util/observer.js";

export function createToolbar({
  appState,
  saveAppData,
  importGlyphs,
  exportGlyphs,
  addGlyph,
  duplicateGlyph,
  deleteGlyph,
  selectGlyph,
  addNode,
  connectNodes,
  deleteSelected,
  selectItems,
  deselectAll,
}) {
  const onClickAddGlyph = () => {
    selectGlyph(addGlyph());
  };

  const onClickDuplicateGlyph = () => {
    if (appState.selectedGlyph) {
      selectGlyph(duplicateGlyph(appState.selectedGlyph));
    }
  };

  const onSelectGlyph = (event) => {
    selectGlyph(event.currentTarget.value);
  };

  const onChangeGlyphName = (event) => {
    const value = event.currentTarget.value;
    if (value.length === 1 || value.toLowerCase() === "ng") {
      appState.selectedGlyph.name = value.toLowerCase();
    }
  };

  const togglePreview = action(() => {
    appState.previewEnabled = !appState.previewEnabled;
  });

  const onConfirmDeleteGlyph = () => {
    deleteGlyph(appState.selectedGlyph);
  };

  const appendNode = action(() => {
    const nodes = appState.selectedGlyph?.nodes;
    const preselectedNode = nodes.find((node) => node.selected);
    const addedNode = addNode();
    if (preselectedNode) {
      selectItems([preselectedNode.id, addedNode.id], nodes);
      connectNodes();
      selectItems([addedNode.id], nodes);
    }
  });

  const NodeSelector = observer((props) => {
    return html`
      <${ItemSelector}
        items=${appState.selectedGlyph?.nodes ?? []}
        selectItems=${selectItems}
        OptionComponent=${NodeOption}
        ...${props}
      />
    `;
  });

  const EdgeSelector = observer((props) => {
    return html`
      <${ItemSelector}
        items=${appState.selectedGlyph?.edges ?? []}
        selectItems=${selectItems}
        OptionComponent=${EdgeOption}
        ...${props}
      />
    `;
  });

  const trajectoryParams = appState.trajectoryParams;

  return observer(
    () =>
      html`<${Toolbar}
        glyphs=${[...appState.glyphs]}
        trajectoryParams=${trajectoryParams}
        onClickSave=${saveAppData}
        onClickImport=${importGlyphs}
        onClickExport=${exportGlyphs}
        onClickAddGlyph=${onClickAddGlyph}
        onClickDuplicateGlyph=${onClickDuplicateGlyph}
        onSelectGlyph=${onSelectGlyph}
        selectedGlyphName=${appState.selectedGlyph?.name || null}
        onChangeGlyphName=${onChangeGlyphName}
        onClickTogglePreview=${togglePreview}
        onConfirmDeleteGlyph=${onConfirmDeleteGlyph}
        onClickDeselect=${deselectAll}
        onClickDeleteSelected=${deleteSelected}
        onClickAddNode=${addNode}
        onClickAppendNode=${appendNode}
        onClickConnect=${connectNodes}
        NodeSelector=${NodeSelector}
        EdgeSelector=${EdgeSelector}
      />`
  );
}

export function Toolbar({
  glyphs,
  trajectoryParams,
  onClickSave,
  onClickImport,
  onClickExport,
  onClickAddGlyph,
  onClickDuplicateGlyph,
  onSelectGlyph,
  selectedGlyphName,
  onChangeGlyphName,
  onClickTogglePreview,
  onConfirmDeleteGlyph,
  onClickDeselect,
  onClickDeleteSelected,
  onClickAddNode,
  onClickAppendNode,
  onClickConnect,
  NodeSelector,
  EdgeSelector,
}) {
  const enableGlyphEditing = selectedGlyphName != null;

  const [glyphNameToDelete, setGlyphNameToDelete] = useState(null);
  const onClickDeleteGlyph = () => {
    if (glyphNameToDelete === selectedGlyphName) {
      onConfirmDeleteGlyph();
      setGlyphNameToDelete(null);
    } else {
      setGlyphNameToDelete(selectedGlyphName);
    }
  };

  return html`
    <style id=${Toolbar.name}>
      .authoringToolbar {
        min-width: 400px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: var(--size-xs);
      }
      .authoringToolbarSection {
        background: var(--color-bg);
        box-shadow: var(--shadow-l);
        border-radius: 4px;
      }
      .authoringToolbarSection > summary {
        display: list-item;
        list-style: inside disclosure-closed;
        padding: var(--size-xs);
        box-sizing: border-box;
      }
      .authoringToolbarSection > div {
        padding: var(--size-s);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-items: stretch;
        gap: var(--size-xs);
      }
      .authoringToolbarSection[open] > summary {
        list-style-type: disclosure-open;
      }
      .authoringToolbarGlyphNameInput {
        text-transform: uppercase;
      }
      .authoringToolbarList {
        min-height: 8lh;
        overflow: auto;
        box-sizing: border-box;
      }
      .authoringToolbarField {
        display: flex;
        flex-direction: column;
        padding-top: var(--size-xs);
      }
    </style>
    <div class="authoringToolbar">
      <${Section} title="File">
        <${Button} onClick=${onClickSave}>Save<//>
        <${Button} onClick=${onClickImport}>Import<//>
        <${Button} onClick=${onClickExport}>Export<//>
      <//>
      <${Section} open title="Glyph collection">
        <${Button} onClick=${onClickAddGlyph}>Add glyph<//>
        <${Button} onClick=${onClickDuplicateGlyph}>Duplicate glyph<//>
        <${Input} tag="select" onChange=${onSelectGlyph}>
          <option hidden disabled selected>Select a glyph to edit</option>
          ${glyphs.map(
            (glyph) => html`<${GlyphOption} key=${glyph.name} glyph=${glyph} />`
          )}
        <//>
      <//>
      <${Section}
        open
        title=${"Glyph properties" +
        (selectedGlyphName
          ? `: ${selectedGlyphName}${toUnicode(selectedGlyphName)}`
          : "")}
      >
        <${Input}
          class="authoringToolbarGlyphNameInput"
          onChange=${onChangeGlyphName}
          value=${selectedGlyphName}
          placeholder="Rename"
          maxlength="2"
          disabled=${!enableGlyphEditing}
        />
        <${Button} onClick=${onClickDeselect} disabled=${!enableGlyphEditing}>
          Deselect all
        <//>
        <${Button}
          variant="danger"
          onClick=${onClickDeleteSelected}
          disabled=${!enableGlyphEditing}
        >
          Delete selected
        <//>
        <${Button} onClick=${onClickAddNode} disabled=${!enableGlyphEditing}>
          Add node
        <//>
        <${Button} onClick=${onClickAppendNode} disabled=${!enableGlyphEditing}>
          Append node
        <//>
        <${NodeSelector} disabled=${!enableGlyphEditing} />
        <${Button} onClick=${onClickConnect} disabled=${!enableGlyphEditing}>
          Connect nodes
        <//>
        <${EdgeSelector} disabled=${!enableGlyphEditing} />
        <${Button}
          variant="danger"
          onClick=${onClickDeleteGlyph}
          disabled=${!enableGlyphEditing}
        >
          ${glyphNameToDelete && glyphNameToDelete === selectedGlyphName
            ? "Confirm delete"
            : "Delete glyph"}
        <//>
      <//>
      <${Section} title="Calligraphy">
        <${Button}
          onClick=${onClickTogglePreview}
          disabled=${!enableGlyphEditing}
        >
          Toggle preview
        <//>
        <label class="authoringToolbarField">
          <${LabelText}>x weight<//>
          <${Input}
            type="range"
            min="0"
            max="1"
            step="0.01"
            onInput=${action(
              (event) =>
                (trajectoryParams.posErrorWeight = Number(
                  event.currentTarget.value
                ))
            )}
            value=${trajectoryParams.posErrorWeight}
          />
        </label>
        <label class="authoringToolbarField">
          <${LabelText}>x’ weight<//>
          <${Input}
            type="range"
            min="0"
            max="1"
            step="0.01"
            onInput=${action(
              (event) =>
                (trajectoryParams.velErrorWeight = Number(
                  event.currentTarget.value
                ))
            )}
            value=${trajectoryParams.velErrorWeight}
          />
        </label>
        <label class="authoringToolbarField">
          <${LabelText}>x’’ weight<//>
          <${Input}
            type="range"
            min="0"
            max="1"
            step="0.01"
            onInput=${action(
              (event) =>
                (trajectoryParams.accelErrorWeight = Number(
                  event.currentTarget.value
                ))
            )}
            value=${trajectoryParams.accelErrorWeight}
          />
        </label>
        <label class="authoringToolbarField">
          <${LabelText}>Lookahead<//>
          <${Input}
            type="range"
            min="1"
            max="60"
            step="1"
            onInput=${action(
              (event) =>
                (trajectoryParams.lookaheadTime = Number(
                  event.currentTarget.value
                ))
            )}
            value=${trajectoryParams.lookaheadTime}
          />
        </label>
        <label class="authoringToolbarField">
          <${LabelText}>Iterations<//>
          <${Input}
            type="range"
            min="1"
            max="4"
            step="1"
            onInput=${action(
              (event) =>
                (trajectoryParams.iterations = Number(
                  event.currentTarget.value
                ))
            )}
            value=${trajectoryParams.iterations}
          />
        </label>
      <//>
    </div>
  `;
}

const Section = ({ title, open, children }) =>
  html`
    <details class="authoringToolbarSection" open=${open}>
      <summary><${LabelText}>${title}<//></summary>
      <div>${children}</div>
    </details>
  `;

/**
 * @param {object} props
 * @param {Array<{ id, selected: boolean }>} props.items
 */
const ItemSelector = observer(
  ({ items, selectItems, OptionComponent, ...props }) => {
    const onChangeSelect = action((event) => {
      const selectedIDs = Array.from(event.currentTarget.selectedOptions).map(
        (option) => Number(option.value)
      );
      selectItems(selectedIDs, items, false);
    });

    return html`
      <${Input}
        class="authoringToolbarList"
        tag="select"
        multiple
        onChange=${onChangeSelect}
        ...${props}
      >
        ${items.map(
          (item) => html`<${OptionComponent} key=${item.id} item=${item} />`
        )}
      <//>
    `;
  }
);

/**
 * @param {object} props
 * @param {import("./index.js").Glyph[]} props.glyph
 */
const GlyphOption = observer(
  ({ glyph }) => html`<option value=${glyph.name}>${glyph.name}</option>`
);

/**
 * @param {object} props
 * @param {import("./node-editor.js").Node[]} props.item
 */
const NodeOption = observer(
  ({ item }) => html`<option value=${item.id}>
    ${selectionIndicator(item.selected)}Node${item.id}
  </option>`
);

/**
 * @param {object} props
 * @param {import("./edge-editor.js").Edge[]} props.item
 */
const EdgeOption = observer(
  ({ item }) => html`<option value=${item.id}>
    ${selectionIndicator(item.selected)}Edge${item.id} [${item.nodes.join("-")}]
  </option>`
);

function toUnicode(selectedGlyphName) {
  const unicode = convertToUnicode([
    /[aeiou]/i.exec(selectedGlyphName)
      ? selectedGlyphName
      : selectedGlyphName + "a",
  ]);
  return unicode ? "/" + unicode : "";
}

function selectionIndicator(selected) {
  return selected ? "*" : "";
}
