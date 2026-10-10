import { html } from "../components/html.js";
import { Button } from "../components/form.js";
import { observer } from "../util/observer.js";

const instagramIconUrl = new URL("./instagram.svg#icon", import.meta.url).href;
const mailIconUrl = new URL("./mail.svg#icon", import.meta.url).href;
const kofiIconUrl = new URL("./kofi.svg#icon", import.meta.url).href;

export function createFileControls(
  canvasRef,
  inputText,
  baybayinUnits,
  viramaStyle,
  calligraphyComplete,
) {
  function downloadCanvas(canvas) {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = formatFileName(inputText.get()) + ".png";
    link.click();
  }

  async function downloadFullCanvas() {
    const { render } = await import("../canvas/render.js");
    const fullCanvas = document.createElement("canvas");
    const ratio = canvasRef.current.width / canvasRef.current.height;
    fullCanvas.width = Math.max(canvasRef.current.width, 2000);
    fullCanvas.height = fullCanvas.width / ratio;
    await render({
      baybayinUnits: baybayinUnits.get(),
      viramaStyle: viramaStyle.get(),
      canvas: fullCanvas,
      speedFactor: 10,
    });
    downloadCanvas(fullCanvas);
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
          height: 100%;
          gap: var(--size-s);
          padding: var(--size-s) var(--size-s) 0;
        }
        .fileControlsActions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--size-s);
        }
        .fileControlsButton {
          text-align: center;
        }
        .fileControlsShareButton {
          grid-column: 1 / -1;
        }
        .fileControlsSocial {
          margin-top: auto;
          font-size: var(--font-size-s);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--size-m);
          color: var(--color-fg-secondary);
        }
        .fileControlsSocialLink {
          display: inline-flex;
          text-decoration: underline;
          color: var(--color-orange-darker);
        }
      </style>
      <div class="fileControls">
        <div class="fileControlsActions">
          <${Button}
            class="fileControlsButton"
            variant="primary"
            onClick=${() => downloadCanvas(canvasRef.current)}
            disabled=${!calligraphyComplete.get()}
          >
            Save
          <//>
          <${Button}
            class="fileControlsButton"
            onClick=${downloadFullCanvas}
            disabled=${!calligraphyComplete.get()}
          >
            Save HD
          <//>
          ${navigator.share &&
          html`<${Button}
            class="fileControlsButton fileControlsShareButton"
            onClick=${shareCanvas}
            disabled=${!calligraphyComplete.get()}
          >
            Share
          <//>`}
        </div>
        <div class="fileControlsSocial">
          <a
            class="fileControlsSocialLink"
            href="https://www.instagram.com/guhitkudlit/"
            target="_blank"
            ><svg width="24" height="24" viewBox="0 0 24 24">
              <use href=${instagramIconUrl} />
            </svg>
          </a>
          <a class="fileControlsSocialLink" href="#" target="_blank">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use href=${kofiIconUrl} />
            </svg>
          </a>
          <a
            class="fileControlsSocialLink"
            href="mailto:guhitkudlit@leanrada.com"
            target="_blank"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use href=${mailIconUrl} />
            </svg>
          </a>
          <span>
            webapp made with ${"<3"} by${" "}
            <a
              class="fileControlsSocialLink"
              href="https://leanrada.com/"
              target="_blank"
              >Lean</a
            >.
          </span>
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
