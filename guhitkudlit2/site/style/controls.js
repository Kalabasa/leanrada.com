import { html } from "../components/html.js";
import { observable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";

export function createStyleControls() {
  const viramaStyle = observable.box("pamudpod");

  const StyleControls = observer(
    () => html`
      <fieldset>
        <legend>Kudlit</legend>
        <label>
          <input
            type="radio"
            name="viramaStyle"
            value="krus"
            checked=${viramaStyle.get() === "krus"}
            onChange=${() => viramaStyle.set("krus")}
          />
          Krus
        </label>
        <label>
          <input
            type="radio"
            name="viramaStyle"
            value="pamudpod"
            checked=${viramaStyle.get() === "pamudpod"}
            onChange=${() => viramaStyle.set("pamudpod")}
          />
          Pamudpod
        </label>
      </fieldset>
    `,
  );

  return { StyleControls, viramaStyle };
}
