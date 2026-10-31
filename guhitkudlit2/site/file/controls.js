import { html } from "../components/html.js";
import { Button } from "../components/form.js";
import { observer } from "../util/observer.js";
import { observable } from "../lib/mobx.js";
import { delay } from "../util/delay.js";
import { drawColorStyledCanvas } from "../style/color-styles.js";

const instagramIconUrl = new URL("./instagram.svg#icon", import.meta.url).href;
const mailIconUrl = new URL("./mail.svg#icon", import.meta.url).href;
const kofiIconUrl = new URL("./kofi.svg#icon", import.meta.url).href;
const tipPageUrl = new URL("../tip/", import.meta.url).href;

export function createFileControls(
  canvasRef,
  inputText,
  calligraphyInputs,
  colorStyle,
  calligraphyComplete,
) {
  const canShareFiles = navigator.canShare?.({
    files: [new File([], "x.png", { type: "image/png" })],
  });
  const isRenderingFull = observable.box(false);
  let cachedFullRender = null;

  function downloadCanvas(canvas) {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = formatFileName(inputText.get()) + ".png";
    link.click();
  }

  async function downloadFullCanvas() {
    const fullCanvas = document.createElement("canvas");
    const ratio = canvasRef.current.width / canvasRef.current.height;
    fullCanvas.width = Math.max(canvasRef.current.width, 2000);
    fullCanvas.height = fullCanvas.width / ratio;

    const renderedInputs = {
      baybayinUnits: calligraphyInputs.baybayinUnits.get(),
      viramaStyle: calligraphyInputs.viramaStyle.get(),
      arrangement: calligraphyInputs.arrangement.get(),
      density: calligraphyInputs.density.get(),
      painterName: calligraphyInputs.painterName.get(),
      colorStyleName: colorStyle.get(),
    };
    const renderKey = JSON.stringify([
      renderedInputs,
      fullCanvas.width,
      fullCanvas.height,
    ]);
    if (cachedFullRender !== null && cachedFullRender.renderKey === renderKey) {
      downloadCanvas(cachedFullRender.fullCanvas);
      return;
    }

    isRenderingFull.set(true);
    try {
      const { render } = await import("../canvas/render.js");
      await delay(25);
      await render({
        ...renderedInputs,
        canvas: fullCanvas,
        speed: 0,
        logo: true,
      });
      cachedFullRender = { renderKey, fullCanvas };
      downloadCanvas(fullCanvas);
    } finally {
      isRenderingFull.set(false);
    }
  }

  async function drawExportCanvas() {
    const { stampLogo } = await import("../canvas/render.js");
    const exportCanvas = drawColorStyledCanvas(
      canvasRef.current,
      colorStyle.get(),
    );
    await stampLogo(exportCanvas);
    return exportCanvas;
  }

  async function saveCanvas() {
    downloadCanvas(await drawExportCanvas());
  }

  async function shareCanvas() {
    (await drawExportCanvas()).toBlob(async (blob) => {
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
          padding: var(--size-s);
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
          position: relative;
          top: var(--size-s);
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
            onClick=${saveCanvas}
            disabled=${!calligraphyComplete.get()}
          >
            Download
          <//>
          <${Button}
            class="fileControlsButton"
            onClick=${downloadFullCanvas}
            disabled=${isRenderingFull.get() || !calligraphyComplete.get()}
          >
            ${isRenderingFull.get() ? "Rendering..." : "Download HD"}
          <//>
          ${canShareFiles &&
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
            ><svg
              role="img"
              aria-label="Instagram"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <use href=${instagramIconUrl} />
            </svg>
          </a>
          <a class="fileControlsSocialLink" href=${tipPageUrl} target="_blank">
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
          <a
            class="fileControlsSocialLink"
            href="mailto:guhitkudlit@leanrada.com"
            target="_blank"
          >
            <svg
              role="img"
              aria-label="Mail"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <use href=${mailIconUrl} />
            </svg>
          </a>
          <a class="fileControlsSocialLink" href="about/">ABOUT</a>
          <span>
            webapp made with ${"<3"} by${" "}
            <a
              class="fileControlsSocialLink"
              href="https://leanrada.com/"
              target="_blank"
              >Lean</a
            >
          </span>
        </div>
      </div>
    `,
  );
  return { FileControls, saveCanvas };
}

function formatFileName(text) {
  return (
    text
      .trim()
      .replace(/[\s\\/:*?"<>|\x00-\x1f]+/g, "-")
      .replace(/^-+|-+$/g, "") + "-guhitkudlit"
  );
}
