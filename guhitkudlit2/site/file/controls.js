import { html } from "../components/html.js";
import { Button } from "../components/form.js";
import { observer } from "../util/observer.js";
import { observable } from "../lib/mobx.js";
import { delay } from "../util/delay.js";
import { drawColorStyledCanvas } from "../style/color-styles.js";
import { CalligraphyStatus } from "../calligraphy/status.js";

const instagramIconUrl = new URL("./instagram.svg#icon", import.meta.url).href;
const mailIconUrl = new URL("./mail.svg#icon", import.meta.url).href;
const kofiIconUrl = new URL("./kofi.svg#icon", import.meta.url).href;
const tipPageUrl = new URL("../tip/", import.meta.url).href;

const gifMaxSizePx = 400;

export function createFileControls(
  canvasRef,
  inputText,
  calligraphyInputs,
  colorStyle,
  calligraphyStatus,
) {
  const canShareFiles = navigator.canShare?.({
    files: [new File([], "x.png", { type: "image/png" })],
  });
  const isRenderingFull = observable.box(false);
  const isRenderingGif = observable.box(false);
  const downloadedText = observable.box(null);
  let cachedFullRender = null;
  let cachedGifRender = null;

  const saveCanvas = async () => {
    downloadCanvas(await drawExportCanvas());
  };

  const downloadCanvas = (canvas) => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = formatFileName(inputText.get()) + ".png";
    link.click();
    downloadedText.set(inputText.get());
  };

  const downloadFullCanvas = async () => {
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
      const { render } = await import("../canvas/render.js").catch((error) => {
        alert("Error loading code. Reload the page and try again.");
        throw error;
      });
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
  };

  const downloadGif = async () => {
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;
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
      canvasWidth,
      canvasHeight,
    ]);
    if (cachedGifRender !== null && cachedGifRender.renderKey === renderKey) {
      downloadGifBytes(cachedGifRender.gifBytes);
      return;
    }

    isRenderingGif.set(true);
    try {
      const { render } = await import("../canvas/render.js").catch((error) => {
        alert("Error loading code. Reload the page and try again.");
        throw error;
      });
      await delay(25);
      const gifCanvas = document.createElement("canvas");
      const gifScale = Math.min(
        1,
        gifMaxSizePx / Math.max(canvasWidth, canvasHeight),
      );
      gifCanvas.width = Math.round(canvasWidth * gifScale);
      gifCanvas.height = Math.round(canvasHeight * gifScale);
      await render({
        ...renderedInputs,
        canvas: gifCanvas,
        speed: 0,
        logo: true,
        onGif: (gifBytes) => {
          cachedGifRender = { renderKey, gifBytes };
          downloadGifBytes(gifBytes);
        },
      });
    } finally {
      isRenderingGif.set(false);
    }
  };

  const downloadGifBytes = (gifBytes) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([gifBytes], { type: "image/gif" }),
    );
    link.download = formatFileName(inputText.get()) + ".gif";
    link.click();
  };

  const shareCanvas = async () => {
    (await drawExportCanvas()).toBlob(async (blob) => {
      const file = new File([blob], formatFileName(inputText.get()) + ".png", {
        type: "image/png",
      });
      try {
        await navigator.share({ files: [file] });
      } catch {}
    }, "image/png");
  };

  const drawExportCanvas = async () => {
    const { stampLogo } = await import("../canvas/render.js").catch((error) => {
      alert("Error loading code. Reload the page and try again.");
      throw error;
    });
    const exportCanvas = drawColorStyledCanvas(
      canvasRef.current,
      colorStyle.get(),
    );
    await stampLogo(exportCanvas);
    return exportCanvas;
  };

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
        .fileControlsFullWidthButton {
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
            class="fileControlsButton fileControlsFullWidthButton"
            variant="primary"
            onClick=${saveCanvas}
            disabled=${!(
              calligraphyStatus.get() >= CalligraphyStatus.completed
            )}
          >
            Download
          <//>
          <${Button}
            class="fileControlsButton"
            onClick=${downloadFullCanvas}
            disabled=${isRenderingFull.get() ||
            !(calligraphyStatus.get() >= CalligraphyStatus.completed)}
          >
            ${isRenderingFull.get() ? "Rendering..." : "Download HD"}
          <//>
          <${Button}
            class="fileControlsButton"
            onClick=${downloadGif}
            disabled=${isRenderingGif.get() ||
            !(calligraphyStatus.get() >= CalligraphyStatus.completed)}
          >
            ${isRenderingGif.get() ? "Rendering..." : "Download GIF"}
          <//>
          ${canShareFiles &&
          html`<${Button}
            class="fileControlsButton fileControlsFullWidthButton"
            onClick=${shareCanvas}
            disabled=${!(
              calligraphyStatus.get() >= CalligraphyStatus.completed
            )}
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
  return { FileControls, saveCanvas, downloadedText };
}

function formatFileName(text) {
  return (
    text
      .trim()
      .replace(/[\s\\/:*?"<>|\x00-\x1f]+/g, "-")
      .replace(/^-+|-+$/g, "") + "-guhitkudlit"
  );
}
