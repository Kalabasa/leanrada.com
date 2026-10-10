import { classes } from "../util/classes.js";
import { html } from "./html.js";

/**
 * @typedef {"top"|"bottom"|"left"|"right"} Direction
 * @param {object} props
 * @param {string} props.class
 * @param {string} props.anchorName
 * @param {Direction} props.direction
 */
export function Tooltip({
  class: className,
  anchorName,
  direction,
  children,
}) {
  return html`
    <style id=${Tooltip.name}>
      @layer base {
        .tooltip {
          position: fixed;
          margin: var(--size-xs);
          padding: var(--size-xs) var(--size-s);
          border-radius: var(--size-xs);
          background: #000;
          color: #fff;
          box-shadow: var(--shadow-m);
          z-index: calc(1 * infinity);
        }
      }
    </style>
    <div
      class=${classes("tooltip", className)}
      style=${{ positionAnchor: anchorName, positionArea: direction }}
    >
      ${children}
    </div>
  `;
}
