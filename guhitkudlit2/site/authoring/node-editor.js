import { html } from "../components/html.js";
import { useCallback, useMemo, useRef, useState } from "../lib/htm-preact.js";
import { computed, runInAction } from "../lib/mobx.js";
import { classes } from "../util/classes.js";
import { observer } from "../util/observer.js";

/**
 * @typedef {{
 *  id: number,
 *  x: number,
 *  y: number,
 *  controlX: number,
 *  controlY: number,
 *  width: number,
 * }} Node
 */

export function NodeEditor({ node, onGrabNode }) {
  const nodeRef = useRef();

  const computedAngle = useMemo(
    () =>
      computed(() =>
        Math.atan2(node.controlX - node.x, -(node.controlY - node.y))
      ),
    [node]
  );

  const computedHeight = useMemo(
    () =>
      computed(
        () => Math.hypot(node.controlX - node.x, node.controlY - node.y) * 2
      ),
    [node]
  );

  const computedWidthHandlePos = useMemo(
    () =>
      computed(() => {
        const localControlX = node.controlX - node.x;
        const localControlY = node.controlY - node.y;
        const height = Math.hypot(localControlX, localControlY) * 2;
        return {
          x: node.x + (-localControlY * node.width) / height,
          y: node.y + (localControlX * node.width) / height,
        };
      }),
    [node]
  );

  const [grabbedNode, setGrabbedNode] = useState(false);
  const [grabbedControl, setGrabbedControl] = useState(false);
  const [grabbedWidth, setGrabbedWidth] = useState(false);

  const ungrab = () => {
    grabbedNode && setGrabbedNode(false);
    grabbedControl && setGrabbedControl(false);
    grabbedWidth && setGrabbedWidth(false);
  };

  const onMouseDown = (event, setGrabbed) => {
    if (event.button !== 0) return;
    setGrabbed(true);
    onGrabNode(node, event);
  };

  const onGrabMouseMove = useCallback(
    (event) => {
      if (!nodeRef.current) return;
      const canvasRect =
        nodeRef.current.base.parentElement.getBoundingClientRect();
      const mouseX = event.clientX - canvasRect.x;
      const mouseY = event.clientY - canvasRect.y;
      runInAction(() => {
        if (grabbedNode) {
          const dx = mouseX - node.x;
          const dy = mouseY - node.y;
          node.x += dx;
          node.y += dy;
          node.controlX += dx;
          node.controlY += dy;
        }
        if (grabbedControl) {
          node.controlX = mouseX;
          node.controlY = mouseY;
        }
        if (grabbedWidth) {
          const localControlX = node.controlX - node.x;
          const localControlY = node.controlY - node.y;
          const height = Math.hypot(localControlX, localControlY) * 2;
          const localMouseX = mouseX - node.x;
          const localMouseY = mouseY - node.y;
          node.width = Math.max(
            0,
            (-localControlY * localMouseX + localControlX * localMouseY) *
              (4 / height)
          );
        }
      });
    },
    [node, grabbedNode, grabbedControl, grabbedWidth]
  );

  return html`
    <style id=${NodeEditor.name}>
      .nodeEditorHighlighted {
        --node-editor-color: magenta;
        z-index: 2;
      }
      .nodeEditorArea {
        position: absolute;
        border: solid 1px var(--node-editor-color, blue);
        border-radius: 50%;
        background: linear-gradient(
            to right,
            transparent 50%,
            var(--node-editor-color, blue) 50%,
            var(--node-editor-color, blue) calc(50% + 1px),
            transparent calc(50% + 1px)
          ) / 100% 50%;
        pointer-events: none;
      }
      .nodeEditorNodeHandle {
        border: solid 1px var(--node-editor-color, blue);
        background: white;
      }
      .nodeEditorControlHandle {
        border-radius: 50%;
        background: var(--node-editor-color, blue);
      }
      .nodeEditorWidthHandle {
        border: solid 1px var(--node-editor-color, blue);
        border-radius: 50%;
        background: white;
      }
      .nodeEditorMouseMoveLayer {
        position: fixed;
        inset: 0;
        cursor: grabbing;
        z-index: 999;
      }
      .nodeEditorHandle {
        position: absolute;
        left: -0.15cm;
        top: -0.15cm;
        width: 0.3cm;
        height: 0.3cm;
        cursor: grab;
      }
    </style>
    <${Area}
      getX=${() => node.x}
      getY=${() => node.y}
      getAngle=${() => computedAngle.get()}
      getWidth=${() => node.width}
      getHeight=${() => computedHeight.get()}
      getHighlighted=${() => node.selected}
    />
    <${Handle}
      ref=${nodeRef}
      class="nodeEditorNodeHandle"
      getX=${() => node.x}
      getY=${() => node.y}
      getHighlighted=${() => node.selected}
      onMouseDown=${(event) => onMouseDown(event, setGrabbedNode)}
    />
    <${Handle}
      class="nodeEditorControlHandle"
      getX=${() => node.controlX}
      getY=${() => node.controlY}
      getHighlighted=${() => node.selected}
      onMouseDown=${(event) => onMouseDown(event, setGrabbedControl)}
    />
    <${Handle}
      class="nodeEditorWidthHandle"
      getX=${() => computedWidthHandlePos.get().x}
      getY=${() => computedWidthHandlePos.get().y}
      getHighlighted=${() => node.selected}
      onMouseDown=${(event) => onMouseDown(event, setGrabbedWidth)}
    />
    ${(grabbedNode || grabbedControl || grabbedWidth) &&
    html`
      <div
        class="nodeEditorMouseMoveLayer"
        onMouseMove=${onGrabMouseMove}
        onMouseUp=${ungrab}
      ></div>
    `}
  `;
}

const Area = observer(
  ({ getX, getY, getAngle, getWidth, getHeight, getHighlighted }) => {
    const transform = `translate(${getX()}px, ${getY()}px) translate(-50%, -50%) rotate(${getAngle()}rad)`;
    return html`
      <div
        class=${classes(
          "nodeEditorArea",
          getHighlighted() && "nodeEditorHighlighted"
        )}
        style=${{
          transform: transform,
          width: getWidth() + "px",
          height: getHeight() + "px",
        }}
      ></div>
    `;
  }
);

const Handle = observer(
  ({ ref, class: className, getX, getY, getHighlighted, onMouseDown }) => {
    const transform = `translate(${getX()}px, ${getY()}px)`;
    return html`
      <div
        ref=${ref}
        class=${classes(
          "nodeEditorHandle",
          getHighlighted() && "nodeEditorHighlighted",
          className
        )}
        style=${{ transform }}
        onMouseDown=${onMouseDown}
      ></div>
    `;
  }
);
