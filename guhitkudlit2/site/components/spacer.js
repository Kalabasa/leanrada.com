import { html } from "./html.js";

export function Spacer({ x, y }) {
  return html`<div style=${{ width: x, height: y }} />`;
}
