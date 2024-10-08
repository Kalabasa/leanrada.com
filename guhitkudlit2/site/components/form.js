import { classes } from "../util/classes.js";
import { html } from "./html.js";

export function Input({ class: className, tag = "input", ...props }) {
  return html`
    <style id=${Input.name}>
      .formInput {
        border: solid 2px var(--color-fg-secondary);
        border-radius: var(--size-xs);
        padding: var(--size-xs);
      }
      .formInput::placeholder {
        opacity: var(--opacity-placeholder);
      }
      .formInput:disabled {
        border-color: var(--color-bg-darker);
      }
    </style>
    <${tag} class=${classes("formInput", className)} ...${props} ></${tag}>
  `;
}

export function Button({ class: className, tag = "button", ...props }) {
  return html`
    <style id=${Button.name}>
      .formButton {
        position: relative;
        background: var(--color-fg);
        color: var(--color-bg);
        text-transform: uppercase;
        font-weight: bold;
        font-size: var(--font-size-s);
        border-radius: var(--size-xs);
        padding: var(--size-s);
        overflow: hidden;
      }
      .formButton::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.1;
      }
      .formButton:not(:disabled):hover::after,
      .formButton:not(:disabled):focus-visible::after {
        background: var(--color-bg);
      }
      .formButton:not(:disabled):active::after {
        background: var(--color-fg);
      }
      .formButton:disabled {
        opacity: var(--opacity-secondary);
      }
    </style>
    <${tag} class=${classes("formButton", className)} ...${props}></${tag}>
  `;
}
