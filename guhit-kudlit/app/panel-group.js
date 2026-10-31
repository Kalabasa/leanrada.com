import { html } from "../components/html.js";
import { useEffect, useRef } from "../lib/htm-preact.js";
import { observable } from "../lib/mobx.js";
import { classes } from "../util/classes.js";
import { delay } from "../util/delay.js";
import { observer } from "../util/observer.js";
import { AppPanel } from "./panel.js";

const panelWidthPx = 500;
const tabStepPx = 80;

export function createPanelGroup() {
  const activeIndex = observable.box(0);

  const activatePanel = (panelIndex) => activeIndex.set(panelIndex);

  const AppPanelGroupImpl = observer(
    ({ panels }) => html`
      <${AppPanelGroup}
        panels=${panels}
        activeIndex=${activeIndex.get()}
        onActivateIndex=${activatePanel}
      />
    `,
  );
  return { AppPanelGroup: AppPanelGroupImpl, activatePanel };
}

function AppPanelGroup({ panels, activeIndex, onActivateIndex }) {
  const contentPanels = panels.filter((panel) => !panel.spacer);
  const narrowWidthPx =
    2 * panelWidthPx + (contentPanels.length - 2) * tabStepPx;
  const collapsedWidthPx =
    panelWidthPx + (contentPanels.length - 1) * tabStepPx;

  const groupRef = useRef();
  const isAutoScrollingRef = useRef(false);

  useEffect(() => {
    const activeItem =
      groupRef.current.querySelectorAll(".appPanelGroupItem")[activeIndex];
    if (
      groupRef.current.contains(document.activeElement) &&
      !activeItem.contains(document.activeElement)
    ) {
      document.activeElement.blur();
    }

    if (!isSnapping(groupRef.current)) return;
    const scroller = groupRef.current.parentElement;
    if (Math.round(scroller.scrollLeft / tabStepPx) === activeIndex) return;

    isAutoScrollingRef.current = true;
    const scrolling =
      scroller.scrollTo({
        left: activeIndex * tabStepPx,
        behavior: "smooth",
      }) ?? delay(1000);
    scrolling.finally(() => {
      isAutoScrollingRef.current = false;
    });
  }, [activeIndex]);

  useEffect(() => {
    const scroller = groupRef.current.parentElement;
    const onScroll = () => {
      if (!isSnapping(groupRef.current)) return;
      if (isAutoScrollingRef.current) return;
      onActivateIndex(Math.round(scroller.scrollLeft / tabStepPx));
    };
    const abortController = new AbortController();
    scroller.addEventListener("scroll", onScroll, abortController);
    return () => abortController.abort();
  }, []);

  return html`
    <style id=${AppPanelGroup.name}>
      .appPanelGroup {
        view-transition-name: appPanelGroup;
        --app-panel-tab-step: ${tabStepPx}px;
        --app-panel-width: ${panelWidthPx}px;
        display: flex;
        width: max-content;
        gap: var(--size-s);
        padding: var(--size-s) var(--size-s) 0;
      }
      .appPanelGroupItem {
        flex: 0 0 var(--app-panel-width);
        position: sticky;
        left: calc(var(--panels-before) * var(--app-panel-tab-step));
        right: calc(var(--panels-after) * var(--app-panel-tab-step));
        pointer-events: none;
        z-index: var(--panel-z);
      }
      .appPanelGroupSpacer {
        flex: 0 0
          calc(
            100vw - 3 * var(--size-m) - (var(--panels-after) - 1) *
              var(--app-panel-tab-step) - (var(--panels-before) + 2) *
              (var(--app-panel-width) + var(--size-s))
          );
      }
      @container not (min-width: ${narrowWidthPx}px) {
        .appPanelGroupItem {
          &:not(.appPanelGroupItemRaised) {
            filter: contrast(0.94);
          }
        }
        .appPanelGroup {
          width: calc(
            var(--app-panel-width) + var(--app-panel-tab-step) *
              ${contentPanels.length - 1} + var(--size-s) * 2
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
            class=${classes(
              "appPanelGroupItem",
              activeIndex === panelsBefore && "appPanelGroupItemRaised",
            )}
            onfocusin=${() => onActivateIndex(panelsBefore)}
            style=${{
              "--panels-before": panelsBefore,
              "--panels-after": contentPanels.length - 1 - panelsBefore,
              "--panel-z":
                contentPanels.length - Math.abs(panelsBefore - activeIndex),
            }}
            key=${index}
          >
            <${AppPanel}
              title=${html`<h2>${panel.title}</h2>`}
              onTitleClick=${() => onActivateIndex(panelsBefore)}
              onDrag=${(dx) => {
                groupRef.current.parentElement.scrollLeft -= dx;
              }}
              >${panel.content}<//
            >
          </div>
        `;
      })}
    </div>
  `;
}

function isSnapping(group) {
  const groupItem = group.querySelector(".appPanelGroupItem");
  return getComputedStyle(groupItem).scrollSnapAlign !== "none";
}

function onWheel(event) {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  event.preventDefault();
  event.currentTarget.parentElement.scrollLeft += event.deltaY;
}
