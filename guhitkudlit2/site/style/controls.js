import { html } from "../components/html.js";
import { observable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";

export function createStyleControls() {
  const viramaStyle = observable.box("pamudpod");
  const separateRa = observable.box(false);

  const StyleControls = observer(
    ({ inputText }) => html`
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
      ${/r/i.test(inputText.get()) &&
      html`<fieldset>
        <legend>R</legend>
        <label>
          <input
            type="radio"
            name="separateRa"
            value="da"
            checked=${!separateRa.get()}
            onChange=${() => separateRa.set(false)}
          />
          Traditional
        </label>
        <label>
          <input
            type="radio"
            name="separateRa"
            value="ra"
            checked=${separateRa.get()}
            onChange=${() => separateRa.set(true)}
          />
          Modern
        </label>
      </fieldset>`}
    `,
  );

  return { StyleControls, viramaStyle, separateRa };
}
