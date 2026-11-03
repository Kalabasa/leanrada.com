import { createContext, useContext } from "../lib/htm-preact.js";
import { html } from "./html.js";

const OptionGroupContext = createContext(null);

export function OptionGroup({ name, value, onChange, columns, children }) {
  const gridStyle = columns
    ? { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)` }
    : null;
  return html`
    <${OptionGroupContext.Provider} value=${{ name, value, onChange }}>
      <div data-appearance="option-group" style=${gridStyle}>${children}</div>
    <//>
  `;
}

export function OptionGroupOption({ value, children }) {
  const optionGroup = useContext(OptionGroupContext);
  return html`
    <label>
      <input
        type="radio"
        name=${optionGroup.name}
        value=${value}
        checked=${optionGroup.value === value}
        onChange=${() => optionGroup.onChange(value)}
      />
      ${children}
    </label>
  `;
}
