import { html } from "../components/html.js";

export function AppPanel({ title, children }) {
  return html`
    <style id=${AppPanel.name}>
      .appPanelContainer {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .appPanelTitle {
        align-self: start;
        padding: var(--size-xs) var(--size-s) 0;
        border-radius: var(--size-s) var(--size-s) 0 0;
        background: var(--color-bg);
        color: var(--color-fg-secondary);
        text-transform: uppercase;
        font-weight: bold;
        font-size: var(--font-size-s);
        box-shadow: var(--shadow-l);
        position: relative;
        z-index: 2;
      }
      .appPanelTitle::after {
        content: "";
        position: absolute;
        background: inherit;
        left: 0;
        right: 0;
        top: calc(100% - 1px);
        height: calc(var(--size-s) + 1px);
      }
      .appPanelContent {
        flex: 1 1 auto;
        padding: var(--size-s);
        background: var(--color-bg);
        border-radius: 0 var(--size-s) 0 0;
        box-shadow: var(--shadow-l);
        z-index: 1;
      }
    </style>
    <aside class="appPanelContainer">
      <div class="appPanelTitle">${title}</div>
      <div class="appPanelContent">${children}</div>
    </aside>
  `;
}
