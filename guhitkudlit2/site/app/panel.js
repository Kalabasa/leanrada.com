import { html } from "../components/html.js";
import { useRef, useState } from "../lib/htm-preact.js";
import { classes } from "../util/classes.js";

const dragThresholdPx = 4;

export function AppPanel({ title, onTitleClick, onDrag, children }) {
  const isDraggingRef = useRef(false);
  const [isGrabbing, setGrabbing] = useState(false);

  const onTitlePointerDown = (event) => {
    if (event.pointerType !== "mouse") return;

    const titleElement = event.currentTarget;
    titleElement.setPointerCapture(event.pointerId);

    const startX = event.clientX;
    let lastX = startX;

    isDraggingRef.current = false;
    setGrabbing(true);

    const abortController = new AbortController();
    titleElement.addEventListener(
      "pointermove",
      (moveEvent) => {
        if (
          !isDraggingRef.current &&
          Math.abs(moveEvent.clientX - startX) < dragThresholdPx
        ) {
          return;
        }
        isDraggingRef.current = true;
        onDrag(moveEvent.clientX - lastX);
        lastX = moveEvent.clientX;
      },
      abortController,
    );
    titleElement.addEventListener("pointerup", endDrag, abortController);
    titleElement.addEventListener("pointercancel", endDrag, abortController);

    function endDrag() {
      abortController.abort();
      setGrabbing(false);
    }
  };

  const onTitleClickUnlessDragged = (event) => {
    if (isDraggingRef.current) return;
    onTitleClick(event);
  };

  return html`
    <style id=${AppPanel.name}>
      .appPanelContainer {
        display: flex;
        flex-direction: column;
        height: 100%;
        pointer-events: none;
        outline: none !important;
        &:focus-within {
          .appPanelTitle {
            color: var(--color-fg);
          }
          .appPanelContent {
            box-shadow: var(--shadow-xl);
          }
        }
        &:not(:focus-within) {
          .appPanelTitle {
            &:hover {
              color: var(--color-fg);
            }
          }
        }
      }
      .appPanelTitle {
        align-self: start;
        min-width: var(--app-panel-tab-step);
        text-align: center;
        padding: var(--size-xs) var(--size-s);
        border-radius: var(--size-xs) var(--size-xs) 0 0;
        background: var(--color-bg);
        color: var(--color-fg-secondary);
        text-transform: uppercase;
        font-weight: bold;
        font-size: var(--font-size-s);
        box-shadow: var(--shadow-m), var(--inset-shade-top);
        position: relative;
        pointer-events: auto;
        user-select: none;
        cursor: grab;
      }
      .appPanelTitleGrabbing {
        cursor: grabbing;
      }
      .appPanelTitle::after {
        content: "";
        position: absolute;
        background: inherit;
        left: 0;
        right: calc(var(--size-m) * -1);
        top: 100%;
        height: calc(var(--size-s) + 1px);
        pointer-events: none;
      }
      .appPanelContent {
        flex: 1 1 auto;
        padding: var(--size-m);
        background: var(--color-bg);
        border-radius: 0 var(--size-s) 0 0;
        box-shadow: var(--shadow-l), var(--inset-shade-top);
        pointer-events: auto;
        @container (max-width: 750px) {
          padding: var(--size-s);
        }
      }
    </style>
    <aside class="appPanelContainer" tabindex="-1">
      <div
        class=${classes("appPanelTitle", isGrabbing && "appPanelTitleGrabbing")}
        tabindex="0"
        onClick=${onTitleClickUnlessDragged}
        onPointerDown=${onTitlePointerDown}
      >
        ${title}
      </div>
      <div class="appPanelContent">${children}</div>
    </aside>
  `;
}
