import { html } from "../components/html.js";
import { AppPanel } from "./panel.js";

export function AppPanelGroup({ panels }) {
  return html`
    <style id=${AppPanelGroup.name}>
      .appPanelGroup {
        --app-panel-tab-step: 80px;
        display: flex;
        width: max-content;
        gap: var(--size-s);
        padding-top: var(--size-m);
      }
      .appPanelGroupItem {
        flex: 0 0 500px;
        position: sticky;
        left: calc(var(--panels-before) * var(--app-panel-tab-step));
        right: calc(var(--panels-after) * var(--app-panel-tab-step));
        pointer-events: none;
      }
      .appPanelGroupItem:focus-within {
        z-index: 1;
        filter: drop-shadow(0 0 24px #0001);
      }
    </style>
    <div class="appPanelGroup">
      ${panels.map(
        ({ title, content }, index) => html`
          <div
            class="appPanelGroupItem"
            style=${{
              "--panels-before": index,
              "--panels-after": panels.length - 1 - index,
            }}
            key=${index}
            tabindex="-1"
          >
            <${AppPanel} title=${html`<h2>${title}</h2>`}>${content}<//>
          </div>
        `,
      )}
    </div>
  `;
}
