import { html } from "../components/html.js";
import { Button } from "../components/form.js";
import { observer } from "../util/observer.js";

export function createFileForm(canvasRef, inputText, calligraphyComplete) {
  function downloadCanvas() {
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = toFileName(inputText.get()) + ".png";
    link.click();
  }

  function shareCanvas() {
    canvasRef.current.toBlob(async (blob) => {
      const file = new File([blob], toFileName(inputText.get()) + ".png", {
        type: "image/png",
      });
      await navigator.share({ files: [file] });
    }, "image/png");
  }

  const FileForm = observer(
    () => html`
      <${Button}
        onClick=${downloadCanvas}
        disabled=${!calligraphyComplete.get()}
      >
        Download image
      <//>
      ${navigator.share &&
      html`<${Button}
        onClick=${shareCanvas}
        disabled=${!calligraphyComplete.get()}
      >
        Share
      <//>`}
    `,
  );
  return { FileForm };
}

function toFileName(text) {
  return text
    .trim()
    .replace(/[\s\\/:*?"<>|\x00-\x1f]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
