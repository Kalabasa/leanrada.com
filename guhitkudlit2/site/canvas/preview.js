import { html } from "../components/html.js";
import { useEffect, useRef } from "../lib/htm-preact.js";

let queuedRenders = Promise.resolve();

export function ControlPreview({
  baybayinUnits,
  viramaStyle,
  arrangement,
  density,
  composeSteps,
  width = baybayinUnits.length * 25,
  height = 30,
}) {
  const canvasRef = useRef();
  useEffect(() => {
    const abortController = new AbortController();
    enqueueRender(() =>
      drawControlPreview(
        canvasRef.current,
        baybayinUnits,
        viramaStyle,
        arrangement,
        density,
        composeSteps,
        abortController.signal,
      ),
    ).finally(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = 1;
    });
    return () => abortController.abort();
  }, []);
  return html`
    <style id=${ControlPreview.name}>
      .controlPreview {
        opacity: 0;
        transition: opacity 0.4s;
      }
    </style>
    <canvas
      class="controlPreview"
      ref=${canvasRef}
      width=${width}
      height=${height}
    />
  `;
}

function enqueueRender(startRender) {
  const finishedRender = queuedRenders.then(startRender);
  queuedRenders = finishedRender.catch(() => {});
  return finishedRender;
}

async function drawControlPreview(
  canvas,
  baybayinUnits,
  viramaStyle,
  arrangement,
  density,
  composeSteps,
  abortSignal,
) {
  const { render } = await import("./render.js");
  await render({
    baybayinUnits,
    viramaStyle,
    arrangement,
    density,
    canvas,
    abortSignal,
    drawInterval: 0,
    composeSteps,
    transparent: true,
    painterName: "basic",
  });
}
