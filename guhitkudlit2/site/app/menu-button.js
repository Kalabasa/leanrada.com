import { html } from "../components/html.js";
import { Button } from "../components/form.js";
import { observer } from "../util/observer.js";

const instagramIconUrl = new URL("../file/instagram.svg#icon", import.meta.url)
  .href;
const kofiIconUrl = new URL("../file/kofi.svg#icon", import.meta.url).href;
const tipPageUrl = new URL("../tip/", import.meta.url).href;

export function createAppMenuButton(
  inputText,
  calligraphyComplete,
  resetApp,
  saveCanvas,
) {
  const resetDialogRef = { current: null };

  function confirmReset() {
    resetDialogRef.current.close();
    resetApp();
  }

  const AppMenuButton = observer(
    () => html`
      <style id=${AppMenuButton.name}>
        .appMenuButton {
          border: none;
          cursor: pointer;
          position: relative;
          padding: 0 var(--size-xs);
          font-family: "Cubao Narrow", sans-serif;
          font-weight: normal;
          font-size: var(--font-size-xl);
          letter-spacing: 0.02em;
          border-radius: var(--size-xs);
          background: #f8f7f6;
          color: #bd1003;
          box-shadow: var(--shadow-l), var(--inset-shade);
          z-index: 0;
          transform-origin: bottom;
          transition: none 0.04s ease-in;
          transition-property: box-shadow, transform;

          > span {
            display: block;
            line-height: 1.2em;
          }
          &::before {
            content: "";
            position: absolute;
            left: 5%;
            right: 5%;
            top: 10%;
            bottom: 10%;
            border-radius: 50%;
            background: #f8ed8d;
            z-index: -1;
          }
          &:focus-visible,
          &:hover {
            box-shadow: var(--shadow-xl), var(--inset-shade);
            transform: scale(1.02);
          }
          &:active {
            box-shadow: var(--shadow-m), var(--inset-shade);
            transform: scale(1);
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
        .appMenuResetDialog {
          max-width: calc(100vw - 2 * var(--size-m));
          padding: var(--size-m);
          border: none;
          border-radius: var(--size-xs);
          background: var(--color-bg);
          color: var(--color-fg);
          box-shadow: var(--shadow-xl);
          &::backdrop {
            background: #0002;
          }
        }
        .appMenuResetDialogActions {
          display: flex;
          justify-content: end;
          gap: var(--size-s);
          margin-top: var(--size-m);
        }
      </style>
      <button
        class="appMenuButton"
        type="button"
        popovertarget="appMenuPopup"
        style=${{ anchorName: "--appMenuButton" }}
      >
        <span>·menu·</span>
      </button>
      <div class="appMenuPopup" id="appMenuPopup" popover="auto">
        <button
          type="button"
          popovertarget="appMenuPopup"
          popovertargetaction="hide"
          onClick=${() => resetDialogRef.current.showModal()}
          disabled=${!inputText.get().length}
        >
          New canvas
        </button>
        <button
          type="button"
          popovertarget="appMenuPopup"
          popovertargetaction="hide"
          onClick=${saveCanvas}
          disabled=${!calligraphyComplete.get()}
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
      <dialog class="appMenuResetDialog" ref=${resetDialogRef}>
        <p>Create a new canvas? Your current piece will be lost.</p>
        <div class="appMenuResetDialogActions">
          <${Button}
            type="button"
            onClick=${() => resetDialogRef.current.close()}
          >
            Cancel
          <//>
          <${Button} type="button" variant="danger" onClick=${confirmReset}>
            New canvas
          <//>
        </div>
      </dialog>
    `,
  );
  return { AppMenuButton };
}
