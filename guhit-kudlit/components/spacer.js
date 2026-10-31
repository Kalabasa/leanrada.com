import { html } from "./html.js";

/**
 * @typedef {"xs"|"s"|"m"|"l"} Size
 * @param {object} props
 * @param {Size} props.x
 * @param {Size} props.y
 */
export function Spacer({ x, y }) {
  return html`<div
    style=${{ width: x && `var(--size-${x})`, height: y && `var(--size-${y})` }}
  />`;
}
