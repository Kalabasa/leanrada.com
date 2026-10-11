import { html } from "../components/html.js";
import { Input } from "../components/form.js";
import {
  OptionGroup,
  OptionGroupOption,
} from "../components/option-group.js";
import { observable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { LabelText } from "../typography/text.js";

export function createStyleControls() {
  const formation = observable.box("normal");

  const onFormationChange = (selectedFormation) => {
    formation.set(selectedFormation);
  };

  const StyleControls = observer(
    () => html`
      <style id=${StyleControls.name}>
        .styleControls {
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          height: 100%;
        }
      </style>
      <div class="styleControls">
        <div class="styleControl">
          <${LabelText}>Formation<//>
          <${OptionGroup}
            name="formation"
            value=${formation.get()}
            onChange=${onFormationChange}
          >
            <${OptionGroupOption} value="normal">normal<//>
            <${OptionGroupOption} value="grid">grid<//>
            <${OptionGroupOption} value="diamond">diamond<//>
          <//>
        </div>
      </div>
    `,
  );

  return { StyleControls, formation };
}
