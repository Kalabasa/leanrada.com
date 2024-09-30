import { html } from "../components/html.js";

export function LabelText({ tagName = "span", children }) {
  return html`
    <style id=${LabelText.name}>
      .labelText {
        text-transform: uppercase;
        font-weight: bold;
        font-size: var(--font-size-s);
      }
    </style>
    <${tagName} class="labelText">${children}<//>
  `;
}
