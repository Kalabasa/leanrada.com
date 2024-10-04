import { classes } from "../util/classes.js";
import { html } from "./html.js";

export function Input({ class: className, ...props }) {
  return html`
    <style id=${Input.name}>
      .input {
        border: solid 2px var(--color-fg-secondary);
        border-radius: var(--size-xs);
        padding: var(--size-xs);
      }
      .input::placeholder {
        opacity: var(--opacity-placeholder);
      }
      .input:disabled {
        border-color: var(--color-bg-darker);
      }
    </style>
    <input class=${classes("input", className)} ...${props} />
  `;
}
