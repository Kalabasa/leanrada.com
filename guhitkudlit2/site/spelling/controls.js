import { ControlPreview } from "../canvas/preview.js";
import { html } from "../components/html.js";
import { OptionGroup, OptionGroupOption } from "../components/option-group.js";
import { observable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { LabelText } from "../typography/text.js";
import { classes } from "../util/classes.js";
import { DEBUG } from "../app/flags.js";

const viramaStyles = ["pamudpod", "krus", "precolonial"];

export function createSpellingControls() {
  const initialViramaStyle = new URLSearchParams(location.search).get(
    "viramaStyle",
  );
  const viramaStyle = observable.box(
    viramaStyles.includes(initialViramaStyle) ? initialViramaStyle : "pamudpod",
  );
  const separateRa = observable.box(false);

  if (initialViramaStyle && !DEBUG) {
    const url = new URL(location.href);
    url.searchParams.delete("viramaStyle");
    history.replaceState(history.state, "", url);
  }

  const SpellingControls = observer(
    ({ inputText, baybayinUnits }) => html`
      <style id=${SpellingControls.name}>
        .spellingControls {
          display: flex;
          flex-direction: column;
          gap: var(--size-m);
          height: 100%;
        }
        .spellingControl {
          transition: opacity 0.6s ease-out;
        }
        .spellingControlDimmed {
          opacity: var(--opacity-tertiary);
        }
      </style>
      <div class="spellingControls">
        <div
          class=${classes(
            "spellingControl",
            !baybayinUnits.get().length && "spellingControlDimmed",
          )}
        >
          <${LabelText}>Virama<//>
          <${OptionGroup}
            name="viramaStyle"
            value=${viramaStyle.get()}
            onChange=${(value) => viramaStyle.set(value)}
          >
            <${OptionGroupOption} value="pamudpod">
              <${ControlPreview}
                baybayinUnits=${["k", "du", "s"]}
                density=${-1.5}
              />
              pamudpod
            <//>
            <${OptionGroupOption} value="krus">
              <${ControlPreview}
                baybayinUnits=${["k", "du", "s"]}
                viramaStyle="krus"
                density=${-1.5}
              />
              krus
            <//>
            <${OptionGroupOption} value="precolonial">
              <${ControlPreview}
                baybayinUnits=${["ki", "du"]}
                viramaStyle="precolonial"
                density=${-1.5}
              />
              none (precolonial)
            <//>
          <//>
        </div>
        <div
          class=${classes(
            "spellingControl",
            (!baybayinUnits.get().length || !inputText.get().includes("r")) &&
              "spellingControlDimmed",
          )}
        >
          <${LabelText}>R distinction<//>
          <${OptionGroup}
            name="separateRa"
            value=${separateRa.get() ? "ra" : "da"}
            onChange=${(value) => separateRa.set(value === "ra")}
          >
            <${OptionGroupOption} value="da">
              <${ControlPreview}
                baybayinUnits=${["da"]}
                viramaStyle="krus"
                density=${-1.5}
              />
              traditional D=R
            <//>
            <${OptionGroupOption} value="ra">
              <${ControlPreview}
                baybayinUnits=${["ra"]}
                viramaStyle="krus"
                density=${-1.5}
              />
              modern R
            <//>
          <//>
        </div>
      </div>
    `,
  );

  return { SpellingControls, viramaStyle, separateRa };
}
