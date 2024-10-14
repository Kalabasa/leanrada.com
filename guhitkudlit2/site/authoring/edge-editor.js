import { html } from "../components/html.js";
import { classes } from "../util/classes.js";
import { observer } from "../util/observer.js";

/**
 * @typedef {import("./node-editor.js").Node} Node
 * @typedef {{
 *  nodes: [number, number]
 * }} Edge
 */

export function EdgeEditor({ edge, getNode, onClickEdge }) {
  const onMouseDown = (event) => {
    if (event.button !== 0) return;
    onClickEdge(edge, event);
  };

  return html`
    <style id=${EdgeEditor.name}>
      .edgeEditorHighlighted {
        --edge-editor-color: magenta;
        z-index: 1;
      }
      .edgeEditorEdgeHandle {
        border: solid 1px var(--edge-editor-color, blue);
        background: white;
      }
      .edgeEditorLine {
        position: absolute;
        stroke: var(--edge-editor-color, blue);
        stroke-width: 1px;
        pointer-events: none;
      }
      .edgeEditorHandle {
        position: absolute;
        left: -0.15cm;
        top: -0.15cm;
        width: 0.3cm;
        height: 0.3cm;
        cursor: pointer;
      }
    </style>
    <${Line}
      class="edgeEditorLine"
      getX1=${() => getNode(edge.nodes[0]).x}
      getY1=${() => getNode(edge.nodes[0]).y}
      getX2=${() => getNode(edge.nodes[1]).x}
      getY2=${() => getNode(edge.nodes[1]).y}
      getHighlighted=${() => edge.selected}
    />
    <${Handle}
      class="edgeEditorEdgeHandle"
      getX=${() => (getNode(edge.nodes[0]).x + getNode(edge.nodes[1]).x) / 2}
      getY=${() => (getNode(edge.nodes[0]).y + getNode(edge.nodes[1]).y) / 2}
      getHighlighted=${() => edge.selected}
      onMouseDown=${onMouseDown}
    />
  `;
}

const Line = observer(
  ({ class: className, getX1, getY1, getX2, getY2, getHighlighted }) => {
    const minX = Math.min(getX1(), getX2());
    const minY = Math.min(getY1(), getY2());
    const maxX = Math.max(getX1(), getX2());
    const maxY = Math.max(getY1(), getY2());
    const transform = `translate(${minX}px, ${minY}px)`;
    return html`
      <svg
        class=${classes(getHighlighted() && "edgeEditorHighlighted", className)}
        style=${{ transform }}
        viewBox="0 0 ${maxX} ${maxY}"
        width=${maxX}
        height=${maxY}
      >
        <line
          x1=${getX1() - minX}
          x2=${getX2() - minX}
          y1=${getY1() - minY}
          y2=${getY2() - minY}
        />
      </svg>
    `;
  }
);

const Handle = observer(
  ({ class: className, getX, getY, getHighlighted, onMouseDown }) => {
    const transform = `translate(${getX()}px, ${getY()}px) rotate(45deg)`;
    return html`
      <div
        class=${classes(
          "edgeEditorHandle",
          getHighlighted() && "edgeEditorHighlighted",
          className
        )}
        style=${{ transform }}
        onMouseDown=${onMouseDown}
      ></div>
    `;
  }
);
