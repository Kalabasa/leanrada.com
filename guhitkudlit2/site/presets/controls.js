import { ControlPreview } from "../canvas/preview.js";
import { html } from "../components/html.js";
import { OptionGroup, OptionGroupOption } from "../components/option-group.js";
import { observer } from "../util/observer.js";
import { formatColorStyleFilter } from "../style/color-styles.js";

const presets = [
  {
    painterName: "brush",
    colorStyle: "blackOnWhite",
    viramaStyle: "pamudpod",
    arrangement: "normal",
    density: 0,
  },
  {
    painterName: "flat",
    colorStyle: "orangeOnWhite",
    viramaStyle: "pamudpod",
    arrangement: "normal",
    density: -1,
  },
  {
    painterName: "spray",
    colorStyle: "greenOnBlack",
    viramaStyle: "krus",
    arrangement: "diamond",
    density: 1,
  },
  {
    painterName: "brush",
    colorStyle: "whiteOnBlack",
    viramaStyle: "pamudpod",
    arrangement: "grid",
    density: 0,
  },
];

export function createPresetControls(presetInputs) {
  const presetKeys = Object.keys(presetInputs);

  const findActivePresetIndex = () =>
    presets.findIndex((preset) =>
      presetKeys.every((key) => presetInputs[key].get() === preset[key]),
    );

  const onPresetChange = (selectedPresetIndex) => {
    const selectedPreset = presets[selectedPresetIndex];
    for (const key of presetKeys) {
      presetInputs[key].set(selectedPreset[key]);
    }
  };

  const PresetControls = observer(
    () => html`
      <style id=${PresetControls.name}>
        .presetControlPreview {
          display: flex;
          background: #fff;
          border-radius: var(--size-xs);
        }
      </style>
      <${OptionGroup}
        name="preset"
        value=${findActivePresetIndex()}
        onChange=${onPresetChange}
        columns=${2}
      >
        ${presets.map(
          (preset, presetIndex) => html`
            <${OptionGroupOption} value=${presetIndex}>
              <span
                class="presetControlPreview"
                style=${{ filter: formatColorStyleFilter(preset.colorStyle) }}
              >
                <${ControlPreview}
                  baybayinUnits=${["ku", "la", "y"]}
                  painterName=${preset.painterName}
                  viramaStyle=${preset.viramaStyle}
                  arrangement=${preset.arrangement}
                  density=${preset.density}
                  width="220"
                  height="104"
                />
              </span>
            <//>
          `,
        )}
      <//>
    `,
  );

  return { PresetControls };
}
