import { html } from "../components/html.js";

export function AppPanel({ title, children }) {
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
          .appPanelTitle,
          .appPanelContent {
            box-shadow: var(--shadow-l);
          }
        }
        &:not(:focus-within) {
          .appPanelTitle {
            cursor: pointer;
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
        padding: var(--size-xs) var(--size-s) 0;
        border-radius: var(--size-s) var(--size-s) 0 0;
        background: var(--color-bg);
        color: var(--color-fg-secondary);
        text-transform: uppercase;
        font-weight: bold;
        font-size: var(--font-size-s);
        box-shadow: var(--shadow-m);
        position: relative;
        pointer-events: auto;
        user-select: none;
      }
      .appPanelTitle::after {
        content: "";
        position: absolute;
        background: inherit;
        left: 0;
        right: calc(var(--size-m) * -1);
        top: calc(100% - 1px);
        height: calc(var(--size-m) + 1px);
        pointer-events: none;
      }
      .appPanelContent {
        flex: 1 1 auto;
        padding: var(--size-m);
        background: var(--color-bg);
        border-radius: 0 var(--size-s) 0 0;
        box-shadow: var(--shadow-m);
        pointer-events: auto;
      }
    </style>
    <aside class="appPanelContainer" tabindex="-1">
      <div class="appPanelTitle" tabindex="0">${title}</div>
      <div class="appPanelContent">${children}</div>
    </aside>
  `;
}
