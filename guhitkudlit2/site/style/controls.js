import { html } from "../components/html.js";
import { observer } from "../util/observer.js";

export function createStyleControls() {
  const StyleControls = observer(
    () => html`
      <style id=${StyleControls.name}>
        .styleControls {
        }
      </style>
      <div class="styleControls"></div>
    `,
  );

  return { StyleControls };
}
