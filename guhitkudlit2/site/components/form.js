import { useMemo } from "../lib/htm-preact.js";
import { classes } from "../util/classes.js";
import { html } from "./html.js";

export function Input({ class: className, tag = "input", ...props }) {
  const Wrapper = useMemo(() => {
    if (tag === "select" && !props.multiple) {
      return ({ children }) =>
        html`<div class="formInputDropdown">${children}</div>`;
    }
    return ({ children }) => children;
  }, [tag, props.multiple]);

  return html`
    <style id=${Input.name}>
      .formInput {
        border: solid 2px var(--color-fg-secondary);
        border-radius: var(--size-xs);
        padding: var(--size-xs);
        box-sizing: border-box;
      }
      .formInput::placeholder {
        opacity: var(--opacity-placeholder);
      }
      .formInput:disabled {
        border-color: var(--color-fg-tertiary);
      }
      .formInput[type="range"] {
        border: none;
        accent-color: var(--color-fg);
        background: linear-gradient(
          to bottom,
          transparent calc(50% - 1px),
          var(--color-fg-secondary) calc(50% - 1px),
          var(--color-fg-secondary) calc(50% + 1px),
          transparent calc(50% + 1px)
        );
      }
      .formInputDropdown {
        position: relative;
      }
      .formInputDropdown * {
        width: 100%;
      }
      .formInputDropdown::after {
        content: "";
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid var(--color-fg-secondary);
        pointer-events: none;
      }
      .formInputDropdown:has(select:disabled)::after {
        border-color: var(--color-fg-tertiary);
      }
    </style>
    <${Wrapper}>
      <${tag} class=${classes("formInput", className)} ...${props} />
    <//>
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
      .formButtonDangerVariant {
        background: var(--color-danger);
      }
    </style>
    <${tag}
      class=${classes("formButton", getVariantClass(props.variant), className)}
      ...${props}
    />
  `;
}

function getVariantClass(variant) {
  switch (variant) {
    case "danger":
      return "formButtonDangerVariant";
  }
  return null;
}
