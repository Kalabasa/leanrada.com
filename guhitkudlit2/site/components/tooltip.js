import { html } from "./html.js";

/**
 * @typedef {"top"|"bottom"|"left"|"right"} Direction
 * @param {object} props
 * @param {string} props.anchorName
 * @param {Direction} props.direction
 */
export function Tooltip({ anchorName, direction, children }) {
  return html`
    <style id=${Tooltip.name}>
      .tooltip {
        position: fixed;
        margin: var(--size-xs);
        padding: var(--size-xs) var(--size-s);
        border-radius: var(--size-xs);
        background: #000;
        color: #fff;
        box-shadow: var(--shadow-m);
        z-index: 10;
      }
    </style>
    <div
      class="tooltip"
      style=${{ positionAnchor: anchorName, positionArea: direction }}
    >
      ${children}
    </div>
  `;
}
