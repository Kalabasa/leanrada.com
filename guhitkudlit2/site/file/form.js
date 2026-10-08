import { html } from "../components/html.js";
import { Button } from "../components/form.js";
import { observer } from "../util/observer.js";

export function createFileForm(canvasRef, calligraphyComplete) {
  function downloadCanvas() {
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = "guhitkudlit.png";
    link.click();
  }

  const FileForm = observer(
    () => html`
      <${Button}
        onClick=${downloadCanvas}
        disabled=${!calligraphyComplete.get()}
      >
        Download image
      <//>
    `,
  );
  return { FileForm };
}
