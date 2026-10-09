import { html } from "../components/html.js";
import { Button } from "../components/form.js";
import { observer } from "../util/observer.js";

const instagramIconUrl = new URL("./instagram.svg#icon", import.meta.url).href;
const mailIconUrl = new URL("./mail.svg#icon", import.meta.url).href;

export function createFileControls(canvasRef, inputText, calligraphyComplete) {
  function downloadCanvas() {
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = formatFileName(inputText.get()) + ".png";
    link.click();
  }

  function shareCanvas() {
    canvasRef.current.toBlob(async (blob) => {
      const file = new File([blob], formatFileName(inputText.get()) + ".png", {
        type: "image/png",
      });
      await navigator.share({ files: [file] });
    }, "image/png");
  }

  const FileControls = observer(
    () => html`
      <style id=${FileControls.name}>
        .fileControls {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: stretch;
          padding: var(--size-m) var(--size-m) var(--size-s);
          height: 100%;
          gap: var(--size-s);
        }
        .fileControlsButton {
          text-align: center;
        }
        .fileControlsFirstBottomRow {
          margin-top: auto;
        }
        .fileControlsSocial {
          display: flex;
          justify-content: center;
          gap: var(--size-m);
        }
        .fileControlsSocialLink {
          display: inline-flex;
          gap: var(--size-xs);
          align-items: center;
          text-decoration: underline;
        }
      </style>
      <div class="fileControls">
        <${Button}
          class="fileControlsButton"
          variant="primary"
          onClick=${downloadCanvas}
          disabled=${!calligraphyComplete.get()}
        >
          Save image
        <//>
        ${navigator.share &&
        html`<${Button}
          class="fileControlsButton"
          onClick=${shareCanvas}
          disabled=${!calligraphyComplete.get()}
        >
          Share image
        <//>`}
        <div class="fileControlsSocial fileControlsFirstBottomRow">
          <a
            class="fileControlsSocialLink"
            href="https://www.instagram.com/guhitkudlit/"
            target="_blank"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use href=${instagramIconUrl} />
            </svg>
            @guhitkudlit
          </a>
          <a
            class="fileControlsSocialLink"
            href="mailto:guhitkudlit@leanrada.com"
            target="_blank"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use href=${mailIconUrl} />
            </svg>
            guhitkudlit@leanrada.com
          </a>
        </div>
        <div class="fileControlsSocial">
          <span style="font-size:80%">
            no AI. webapp made with ${"<3"} by${" "}
            <a
              class="fileControlsSocialLink"
              href="https://leanrada.com/"
              target="_blank"
              >Lean.</a
            ></span
          >
        </div>
      </div>
    `,
  );
  return { FileControls };
}

function formatFileName(text) {
  return (
    text
      .trim()
      .replace(/[\s\\/:*?"<>|\x00-\x1f]+/g, "-")
      .replace(/^-+|-+$/g, "") + "-guhitkudlit"
  );
}
