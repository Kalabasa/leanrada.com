import { createContext, useContext } from "../lib/htm-preact.js";
import { html } from "./html.js";

const OptionGroupContext = createContext(null);

export function OptionGroup({ name, value, onChange, children }) {
  return html`
    <style id=${OptionGroup.name}>
      @layer base {
        .optionGroup {
          anchor-scope: --optionGroupOptionActive;
          display: flex;
          position: relative;
          z-index: 0;
          &::before {
            content: "";
            background: #f0f0f0;
            position: absolute;
            inset: 0;
            border-radius: var(--size-xs);
            z-index: -2;
          }
          &::after {
            content: "";
            background: #fff;
            border: solid 2px var(--color-orange);
            border-radius: var(--size-xs);
            position: absolute;
            inset: anchor(--optionGroupOptionActive top)
              anchor(--optionGroupOptionActive right)
              anchor(--optionGroupOptionActive bottom)
              anchor(--optionGroupOptionActive left);
            transition: inset 0.15s;
            z-index: -1;
          }
        }
        .optionGroupOption {
          flex: 1 1 1%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--size-xs);
          cursor: pointer;
          font-size: var(--font-size-s);
          font-weight: bold;
          border-radius: var(--size-xs);
          &:has(input:checked) {
            anchor-name: --optionGroupOptionActive;
          }
          &:not(:has(input:checked)) {
            &:hover {
              background: #0001;
            }
            &:active {
              background: #0002;
            }
          }
          input {
            position: absolute;
            opacity: 0;
            pointer-events: none;
          }
        }
      }
    </style>
    <${OptionGroupContext.Provider} value=${{ name, value, onChange }}>
      <div class="optionGroup">${children}</div>
    <//>
  `;
}

export function OptionGroupOption({ value, children }) {
  const optionGroup = useContext(OptionGroupContext);
  return html`
    <label class="optionGroupOption">
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
