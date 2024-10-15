import { Button, Input } from "../components/form.js";
import { html } from "../components/html.js";
import { Spacer } from "../components/spacer.js";
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

  const onSelectGlyph = (event) => {
    selectGlyph(event.currentTarget.value);
  };

  const onChangeGlyphName = (event) => {
    if (event.currentTarget.value.length === 1) {
      appState.selectedGlyph.name = event.currentTarget.value.toLowerCase();
    }
  };

  const togglePreview = action(() => {
    appState.previewEnabled = !appState.previewEnabled;
  });

  const onConfirmDeleteGlyph = () => {
    deleteGlyph(appState.selectedGlyph);
  };

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

  return observer(
    () =>
      html`<${Toolbar}
        glyphs=${[...appState.glyphs]}
        onClickSave=${saveAppData}
        onClickImport=${importGlyphs}
        onClickExport=${exportGlyphs}
        onClickAddGlyph=${onClickAddGlyph}
        onSelectGlyph=${onSelectGlyph}
        selectedGlyphName=${appState.selectedGlyph?.name || null}
        onChangeGlyphName=${onChangeGlyphName}
        onClickTogglePreview=${togglePreview}
        onConfirmDeleteGlyph=${onConfirmDeleteGlyph}
        enableGlyphEditing=${appState.selectedGlyph != null}
        onClickDeselect=${deselectAll}
        onClickDeleteSelected=${deleteSelected}
        onClickAddNode=${addNode}
        onClickConnect=${connectNodes}
        selectItems=${selectItems}
        NodeSelector=${NodeSelector}
        EdgeSelector=${EdgeSelector}
      />`
  );
}

export function Toolbar({
  glyphs,
  onClickSave,
  onClickImport,
  onClickExport,
  onClickAddGlyph,
  onSelectGlyph,
  selectedGlyphName,
  onChangeGlyphName,
  onClickTogglePreview,
  onConfirmDeleteGlyph,
  onClickDeselect,
  onClickDeleteSelected,
  onClickAddNode,
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
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: var(--size-xs);
      }
      .authoringToolbarGlyphNameInput {
        text-transform: uppercase;
      }
      .authoringToolbarList {
        min-height: 8lh;
        overflow: auto;
        box-sizing: border-box;
      }
    </style>
    <div class="authoringToolbar">
      <${LabelText}>File<//>
      <${Button} onClick=${onClickSave}>Save<//>
      <${Button} onClick=${onClickImport}>Import<//>
      <${Button} onClick=${onClickExport}>Export<//>
      <${Spacer} y="l" />
      <${LabelText}>Glyph collection<//>
      <${Button} onClick=${onClickAddGlyph}>Add glyph<//>
      <${Input} tag="select" onChange=${onSelectGlyph}>
        <option hidden disabled selected>Select a glyph to edit</option>
        ${glyphs.map(
          (glyph) => html`<${GlyphOption} key=${glyph.name} glyph=${glyph} />`
        )}
      <//>
      <${Spacer} y="l" />
      <${LabelText}>
        Glyph
        properties${selectedGlyphName
          ? `: ${selectedGlyphName}${toUnicode(selectedGlyphName)}`
          : ""}
      <//>
      <${Input}
        class="authoringToolbarGlyphNameInput"
        onChange=${onChangeGlyphName}
        value=${selectedGlyphName}
        placeholder="Rename"
        maxlength="1"
        disabled=${!enableGlyphEditing}
      />
      <${Button} onClick=${onClickTogglePreview} disabled=${!enableGlyphEditing}>
        Toggle preview
      <//>
      <${Button} onClick=${onClickDeselect} disabled=${!enableGlyphEditing}>
        Deselect all
      <//>
      <${Button}
        onClick=${onClickDeleteSelected}
        disabled=${!enableGlyphEditing}
      >
        Delete selected
      <//>
      <${Button} onClick=${onClickAddNode} disabled=${!enableGlyphEditing}>
        Add node
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
    </div>
  `;
}

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
