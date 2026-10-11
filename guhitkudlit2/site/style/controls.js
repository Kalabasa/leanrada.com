import { ControlPreview } from "../canvas/preview.js";
import { html } from "../components/html.js";
import { OptionGroup, OptionGroupOption } from "../components/option-group.js";
import { observable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { LabelText } from "../typography/text.js";
import { classes } from "../util/classes.js";

const previewBaybayinUnits = ["ka", "la", "ba", "sa"];

export function createStyleControls() {
  const arrangement = observable.box("normal");

  const onArrangementChange = (selectedArrangement) => {
    arrangement.set(selectedArrangement);
  };

  const density = observable.box(0);

  const onDensityChange = (selectedDensity) => {
    density.set(selectedDensity);
  };

  const StyleControls = observer(
    ({ baybayinUnits }) => html`
      <style id=${StyleControls.name}>
        .styleControls {
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          height: 100%;
        }
        .styleControl {
          transition: opacity 0.6s ease-out;
        }
        .styleControlDimmed {
          opacity: var(--opacity-tertiary);
        }
      </style>
      <div class="styleControls">
        <div
          class=${classes(
            "styleControl",
            !baybayinUnits.get().length && "styleControlDimmed",
          )}
        >
          <${LabelText}>Arrangement<//>
          <${OptionGroup}
            name="arrangement"
            value=${arrangement.get()}
            onChange=${onArrangementChange}
          >
            <${OptionGroupOption} value="normal">
              <${ControlPreview}
                baybayinUnits=${previewBaybayinUnits}
                viramaStyle="pamudpod"
                arrangement="normal"
                composeSteps=${5}
                width="100"
                height="45"
              />
            <//>
            <${OptionGroupOption} value="grid">
              <${ControlPreview}
                baybayinUnits=${previewBaybayinUnits}
                viramaStyle="pamudpod"
                arrangement="grid"
                composeSteps=${5}
                width="100"
                height="45"
              />
            <//>
            <${OptionGroupOption} value="diamond">
              <${ControlPreview}
                baybayinUnits=${previewBaybayinUnits}
                viramaStyle="pamudpod"
                arrangement="diamond"
                composeSteps=${5}
                width="100"
                height="45"
              />
            <//>
          <//>
        </div>
        <div
          class=${classes(
            "styleControl",
            !baybayinUnits.get().length && "styleControlDimmed",
          )}
        >
          <${LabelText}>Density<//>
          <${OptionGroup}
            name="density"
            value=${density.get()}
            onChange=${onDensityChange}
          >
            <${OptionGroupOption} value=${-1}>
              <${ControlPreview}
                baybayinUnits=${previewBaybayinUnits}
                viramaStyle="pamudpod"
                density=${-1.5}
                composeSteps=${15}
              />
              maluwag
            <//>
            <${OptionGroupOption} value=${0}>
              <${ControlPreview}
                baybayinUnits=${previewBaybayinUnits}
                viramaStyle="pamudpod"
                density=${0}
                composeSteps=${15}
              />
              saks lang
            <//>
            <${OptionGroupOption} value=${1}>
              <${ControlPreview}
                baybayinUnits=${previewBaybayinUnits}
                viramaStyle="pamudpod"
                density=${1.5}
                composeSteps=${15}
              />
              siksik
            <//>
          <//>
        </div>
      </div>
    `,
  );

  return { StyleControls, arrangement, density };
}
