import { html } from "../components/html.js";
import { AppPanel } from "./panel.js";

export function AppPanelGroup({ panels }) {
  return html`
    <style id=${AppPanelGroup.name}>
      .appPanelGroup {
        display: flex;
        gap: var(--size-m);
      }
      .appPanelGroupItem {
        flex: 0 0 500px;
      }
    </style>
    <div class="appPanelGroup">
      ${panels.map(
        ({ title, content }, index) => html`
          <div class="appPanelGroupItem" key=${index}>
            <${AppPanel} title=${title}>${content}<//>
          </div>
        `,
      )}
    </div>
  `;
}
