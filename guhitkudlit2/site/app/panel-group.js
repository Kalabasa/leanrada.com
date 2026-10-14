import { html } from "../components/html.js";
import { AppPanel } from "./panel.js";

const panelWidthPx = 500;
const tabStepPx = 80;

export function AppPanelGroup({ panels }) {
  const contentPanels = panels.filter((panel) => !panel.spacer);
  const firstPanelUnoccludedWidthPx =
    2 * panelWidthPx + (contentPanels.length - 2) * tabStepPx;
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
      .appPanelGroupItem:first-child {
        z-index: 1;
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
      @container not (min-width: ${firstPanelUnoccludedWidthPx}px) {
        .appPanelGroup {
          width: calc(
            var(--app-panel-width) + var(--app-panel-tab-step) *
              ${contentPanels.length - 1}
          );
          overflow: hidden;
        }
      }
    </style>
    <div class="appPanelGroup">
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
            style=${{
              "--panels-before": panelsBefore,
              "--panels-after": contentPanels.length - 1 - panelsBefore,
            }}
            key=${index}
          >
            <${AppPanel} title=${html`<h2>${panel.title}</h2>`}
              >${panel.content}<//
            >
          </div>
        `;
      })}
    </div>
  `;
}
