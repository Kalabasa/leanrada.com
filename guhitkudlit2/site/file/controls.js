import { html } from "../components/html.js";
import { Button } from "../components/form.js";
import { observer } from "../util/observer.js";

const instagramIconUrl = new URL("./instagram.svg#icon", import.meta.url).href;
const mailIconUrl = new URL("./mail.svg#icon", import.meta.url).href;

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

  async function downloadHiresCanvas() {
    const { drawCalligraphy } = await import("../calligraphy/calligraphy.js");
    const hiresCanvas = document.createElement("canvas");
    hiresCanvas.width = canvasRef.current.width * 2;
    hiresCanvas.height = canvasRef.current.height * 2;
    const context = hiresCanvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, hiresCanvas.width, hiresCanvas.height);
    await drawCalligraphy(
      baybayinUnits.get(),
      context,
      new AbortController().signal,
      { viramaStyle: viramaStyle.get() },
    );
    downloadCanvas(hiresCanvas);
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
          padding: var(--size-m) var(--size-m) 0;
          height: 100%;
          gap: var(--size-s);
        }
        .fileControlsButton {
          text-align: center;
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
        <${Button}
          class="fileControlsButton"
          variant="primary"
          onClick=${() => downloadCanvas(canvasRef.current)}
          disabled=${!calligraphyComplete.get()}
        >
          Save image
        <//>
        <${Button}
          class="fileControlsButton"
          onClick=${downloadHiresCanvas}
          disabled=${!calligraphyComplete.get()}
        >
          Save HD image
        <//>
        ${navigator.share &&
        html`<${Button}
          class="fileControlsButton"
          onClick=${shareCanvas}
          disabled=${!calligraphyComplete.get()}
        >
          Share image
        <//>`}
        <div class="fileControlsSocial">
          <a
            class="fileControlsSocialLink"
            href="https://www.instagram.com/guhitkudlit/"
            target="_blank"
          ><svg width="24" height="24" viewBox="0 0 24 24">
              <use href=${instagramIconUrl} />
            </svg></a>
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
            no AI. webapp made with ${"<3"} by${" "}
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
