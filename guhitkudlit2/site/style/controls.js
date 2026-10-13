import { ControlPreview } from "../canvas/preview.js";
import { html } from "../components/html.js";
import { OptionGroup, OptionGroupOption } from "../components/option-group.js";
import { observable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { LabelText } from "../typography/text.js";
import { classes } from "../util/classes.js";
import { colorStyles, formatColorStyleFilter } from "./color-styles.js";


export function createStyleControls() {
  const colorStyle = observable.box(colorStyles[0].name);

  const onColorStyleChange = (selectedColorStyle) => {
    colorStyle.set(selectedColorStyle);
  };

  const painterName = observable.box("brush");

  const onPainterNameChange = (selectedPainterName) => {
    painterName.set(selectedPainterName);
  };

  const StyleControls = observer(
    ({ baybayinUnits }) => html`
      <style id=${StyleControls.name}>
        .styleControls {
          display: flex;
          flex-direction: column;
          gap: var(--size-m);
          height: 100%;
        }
        .styleControl {
          transition: opacity 0.6s ease-out;
        }
        .styleControlDimmed {
          opacity: var(--opacity-tertiary);
        }
        .styleControlColorPreview {
          display: flex;
          background: #fff;
          border-radius: var(--size-xs);
        }
      </style>
      <div class="styleControls">
        <div
          class=${classes(
            "styleControl",
            !baybayinUnits.get().length && "styleControlDimmed",
          )}
        >
          <${LabelText}>Color<//>
          <${OptionGroup}
            name="colorStyle"
            value=${colorStyle.get()}
            onChange=${onColorStyleChange}
          >
            ${colorStyles.map(
              (previewedColorStyle) => html`
                <${OptionGroupOption} value=${previewedColorStyle.name}>
                  <span
                    class="styleControlColorPreview"
                    style=${{
                      filter: formatColorStyleFilter(previewedColorStyle.name),
                    }}
                  >
                    <${ControlPreview}
                      baybayinUnits=${["ku", "la", "y"]}
                      width="100"
                      height="65"
                    />
                  </span>
                <//>
              `,
            )}
          <//>
        </div>
        <div
          class=${classes(
            "styleControl",
            !baybayinUnits.get().length && "styleControlDimmed",
          )}
        >
          <${LabelText}>Brush<//>
          <${OptionGroup}
            name="painterName"
            value=${painterName.get()}
            onChange=${onPainterNameChange}
          >
            <${OptionGroupOption} value="brush">
              <${ControlPreview}
                baybayinUnits=${["ga"]}
                painterName="brush"
                width="65"
                height="65"
              />
            <//>
            <${OptionGroupOption} value="flat">
              <${ControlPreview}
                baybayinUnits=${["ga"]}
                painterName="flat"
                width="65"
                height="65"
              />
            <//>
            <${OptionGroupOption} value="spray">
              <${ControlPreview}
                baybayinUnits=${["ga"]}
                painterName="spray"
                width="65"
                height="65"
              />
            <//>
          <//>
        </div>
      </div>
    `,
  );

  return { StyleControls, colorStyle, painterName };
}
