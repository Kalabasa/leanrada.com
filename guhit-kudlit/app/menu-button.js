import { html } from "../components/html.js";
import { observer } from "../util/observer.js";
import { CalligraphyStatus } from "../calligraphy/status.js";

const instagramIconUrl = new URL("../file/instagram.svg#icon", import.meta.url)
  .href;
const kofiIconUrl = new URL("../file/kofi.svg#icon", import.meta.url).href;
const tipPageUrl = new URL("../tip/", import.meta.url).href;

export function createAppMenuButton(
  inputText,
  calligraphyStatus,
  openResetDialog,
  saveCanvas,
) {
  const AppMenuButton = observer(
    () => html`
      <style id=${AppMenuButton.name}>
        .appMenuButton {
          @media (max-width: 800px) {
            font-size: 24px;
          }
        }
        .appMenuPopup {
          position-anchor: --appMenuButton;
          position-area: bottom span-left;
          margin: var(--size-xs) 0 0;
          min-width: 10em;
          border-radius: var(--size-xs);
          background: var(--color-bg);
          box-shadow: var(--shadow-m), var(--inset-shade);
          &:popover-open {
            display: flex;
            flex-direction: column;
          }
          > * {
            padding: var(--size-s);
            border-radius: var(--size-xs);
            cursor: pointer;
            &:where(a, button):hover,
            &:where(a, button):focus-visible {
              background: var(--color-bg-secondary);
            }
            &:where(a, button):disabled {
              cursor: default;
              opacity: var(--opacity-tertiary);
              background: none;
            }
          }
        }
        .appMenuSocial {
          padding: var(--size-xs);
          display: flex;
          justify-content: center;
          gap: var(--size-m);
          cursor: default;
        }
      </style>
      <button
        class="appMenuButton"
        data-appearance="signage-button"
        type="button"
        popovertarget="appMenuPopup"
        style=${{ anchorName: "--appMenuButton" }}
      >
        ·menu·
      </button>
      <div class="appMenuPopup" id="appMenuPopup" popover="auto">
        <button
          type="button"
          popovertarget="appMenuPopup"
          popovertargetaction="hide"
          onClick=${openResetDialog}
          disabled=${!inputText.get().length}
        >
          New canvas
        </button>
        <button
          type="button"
          popovertarget="appMenuPopup"
          popovertargetaction="hide"
          onClick=${saveCanvas}
          disabled=${!(calligraphyStatus.get() >= CalligraphyStatus.completed)}
        >
          Download image
        </button>
        <a href="help/">Baybayin guide</a>
        <a href="about/">About GuhitKudlit</a>
        <div class="appMenuSocial">
          <a href="https://www.instagram.com/guhitkudlit/" target="_blank">
            <svg
              role="img"
              aria-label="Instagram"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <use href=${instagramIconUrl} />
            </svg>
          </a>
          <a href=${tipPageUrl} target="_blank">
            <svg
              role="img"
              aria-label="Tip"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <use href=${kofiIconUrl} />
            </svg>
          </a>
        </div>
      </div>
    `,
  );
  return { AppMenuButton };
}
