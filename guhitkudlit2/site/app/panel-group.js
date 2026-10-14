import { html } from "../components/html.js";
import { useEffect, useRef, useState } from "../lib/htm-preact.js";
import { AppPanel } from "./panel.js";

const panelWidthPx = 500;
const tabStepPx = 80;

export function AppPanelGroup({ panels }) {
  const contentPanels = panels.filter((panel) => !panel.spacer);
  const narrowScreenPx =
    2 * panelWidthPx + (contentPanels.length - 2) * tabStepPx;
  const collapsedWidthPx =
    panelWidthPx + (contentPanels.length - 1) * tabStepPx;
  const groupRef = useRef();
  const [snappedPanelIndex, setSnappedPanelIndex] = useState(0);
  useEffect(() => {
    const scroller = groupRef.current.parentElement;
    const onScrollEnd = () => {
      setSnappedPanelIndex(Math.round(scroller.scrollLeft / tabStepPx));
    };
    scroller.addEventListener("scrollend", onScrollEnd);
    return () => scroller.removeEventListener("scrollend", onScrollEnd);
  }, []);
  return html`
    <style id=${AppPanelGroup.name}>
      .appPanelGroup {
        --app-panel-tab-step: ${tabStepPx}px;
        --app-panel-width: ${panelWidthPx}px;
        display: flex;
        width: max-content;
        gap: var(--size-s);
        padding-top: var(--size-m);
      }
      .appPanelGroupItem {
        flex: 0 0 var(--app-panel-width);
        position: sticky;
        left: calc(var(--panels-before) * var(--app-panel-tab-step));
        right: calc(var(--panels-after) * var(--app-panel-tab-step));
        pointer-events: none;
      }
      .appPanelGroupItem:focus-within {
        z-index: 1;
      }
      .appPanelGroupSpacer {
        flex: 0 0
          calc(
            100vw - 2 * var(--size-m) - (var(--panels-after) - 1) *
              var(--app-panel-tab-step) - (var(--panels-before) + 2) *
              (var(--app-panel-width) + var(--size-s))
          );
      }
      @container not (min-width: ${narrowScreenPx}px) {
        .appPanelGroupItem:first-child {
          z-index: 1;
        }
        .appPanelGroup {
          width: calc(
            var(--app-panel-width) + var(--app-panel-tab-step) *
              ${contentPanels.length - 1}
          );
          overflow: hidden;
        }
      }
      @container not (min-width: ${collapsedWidthPx}px) {
        .appPanelGroup {
          --app-panel-width: 100cqi;
          display: grid;
          grid-template-columns: var(--app-panel-width);
          overflow: visible;
        }
        .appPanelGroupItem {
          grid-area: 1 / 1;
          position: relative;
          right: auto;
          scroll-snap-align: center;
        }
        .appPanelGroupSpacer {
          display: none;
        }
        .appPanelGroupItem[snapped] {
          z-index: 2;
        }
      }
    </style>
    <div class="appPanelGroup" ref=${groupRef} onWheel=${onWheel}>
      ${panels.map((panel, index) => {
        const panelsBefore = contentPanels.filter(
          (contentPanel) => panels.indexOf(contentPanel) < index,
        ).length;
        if (panel.spacer) {
          return html`
            <div
              class="appPanelGroupSpacer"
              style=${{
                "--panels-before": panelsBefore,
                "--panels-after": contentPanels.length - 1 - panelsBefore,
              }}
              key=${index}
            ></div>
          `;
        }
        return html`
          <div
            class="appPanelGroupItem"
            snapped=${panelsBefore === snappedPanelIndex}
            style=${{
              "--panels-before": panelsBefore,
              "--panels-after": contentPanels.length - 1 - panelsBefore,
            }}
            key=${index}
          >
            <${AppPanel}
              title=${html`<h2>${panel.title}</h2>`}
              onTitleClick=${(event) => scrollToPanel(event, panelsBefore)}
              >${panel.content}<//
            >
          </div>
        `;
      })}
    </div>
  `;
}

function scrollToPanel(event, panelIndex) {
  const groupItem = event.currentTarget.closest(".appPanelGroupItem");
  if (getComputedStyle(groupItem).scrollSnapAlign === "none") return;
  const scroller = groupItem.parentElement.parentElement;
  scroller.scrollTo({ left: panelIndex * tabStepPx, behavior: "smooth" });
}

function onWheel(event) {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  event.preventDefault();
  event.currentTarget.parentElement.scrollLeft += event.deltaY;
}
