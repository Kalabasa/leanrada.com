import { ControlPreview } from "../canvas/preview.js";
import { html } from "../components/html.js";
import { OptionGroup, OptionGroupOption } from "../components/option-group.js";
import { observable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { LabelText } from "../typography/text.js";
import { classes } from "../util/classes.js";

export function createLayoutControls() {
  const arrangement = observable.box("normal");

  const onArrangementChange = (selectedArrangement) => {
    arrangement.set(selectedArrangement);
  };

  const density = observable.box(0);

  const onDensityChange = (selectedDensity) => {
    density.set(selectedDensity);
  };

  const LayoutControls = observer(
    ({ baybayinUnits }) => html`
      <style id=${LayoutControls.name}>
        .layoutControls {
          display: flex;
          flex-direction: column;
          gap: var(--size-m);
          height: 100%;
        }
        .layoutControl {
          transition: opacity 0.6s ease-out;
        }
        .layoutControlDimmed {
          opacity: var(--opacity-tertiary);
        }
      </style>
      <div class="layoutControls">
        <div
          class=${classes(
            "layoutControl",
            !baybayinUnits.get().length && "layoutControlDimmed",
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
                baybayinUnits=${["ka", "la", "ba", "sa"]}
                width="120"
                height="30"
              />
            <//>
            <${OptionGroupOption} value="grid">
              <${ControlPreview}
                baybayinUnits=${["ka", "la", "ba", "sa"]}
                arrangement="grid"
                width="47"
                height="47"
              />
            <//>
            <${OptionGroupOption} value="diamond">
              <${ControlPreview}
                baybayinUnits=${["ka", "la", "ba", "sa"]}
                arrangement="diamond"
                width="47"
                height="65"
              />
            <//>
          <//>
        </div>
        <div
          class=${classes(
            "layoutControl",
            !baybayinUnits.get().length && "layoutControlDimmed",
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
                baybayinUnits=${["si", "ya", "ma", "n", "ya", "n"]}
                density=${-1.5}
                composeSteps=${15}
                width="100"
              />
              maluwag
            <//>
            <${OptionGroupOption} value=${0}>
              <${ControlPreview}
                baybayinUnits=${["si", "ya", "ma", "n", "ya", "n"]}
                composeSteps=${15}
                width="100"
              />
              saks lang
            <//>
            <${OptionGroupOption} value=${1}>
              <${ControlPreview}
                baybayinUnits=${["si", "ya", "ma", "n", "ya", "n"]}
                density=${1.5}
                composeSteps=${15}
                width="100"
              />
              siksik
            <//>
          <//>
        </div>
      </div>
    `,
  );

  return { LayoutControls, arrangement, density };
}
