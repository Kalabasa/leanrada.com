import { html } from "../components/html.js";
import { Input } from "../components/form.js";
import { observable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";

export function createStyleControls() {
  const formation = observable.box("normal");

  const onFormationChange = (event) => {
    formation.set(event.currentTarget.value);
  };

  const StyleControls = observer(
    () => html`
      <style id=${StyleControls.name}>
        .styleControls {
        }
      </style>
      <div class="styleControls">
        <${Input}
          tag="select"
          value=${formation.get() ?? ""}
          onChange=${onFormationChange}
        >
          <option value="normal">normal</option>
          <option value="grid">grid</option>
          <option value="diamond">diamond</option>
        <//>
      </div>
    `,
  );

  return { StyleControls, formation };
}
