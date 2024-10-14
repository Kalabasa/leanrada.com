import { html } from "../components/html.js";

export function LabelText({ tag = "span", children }) {
  return html`
    <style id=${LabelText.name}>
      .labelText {
        text-transform: uppercase;
        font-weight: bold;
        font-size: var(--font-size-s);
        line-height: var(--font-size-s);
      }
    </style>
    <${tag} class="labelText">${children}<//>
  `;
}
