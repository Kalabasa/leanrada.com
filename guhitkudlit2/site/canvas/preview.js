import { html } from "../components/html.js";
import { useEffect, useRef } from "../lib/htm-preact.js";

let queuedRenders = Promise.resolve();

export function ControlPreview({
  baybayinUnits,
  viramaStyle = "pamudpod",
  arrangement = "normal",
  density = 0,
  composeSteps = 5,
  painterName = "basic",
  width = baybayinUnits.length * 40,
  height = 50,
}) {
  const containerRef = useRef();
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
        painterName,
        abortController.signal,
      ),
    ).finally(() => {
      if (containerRef.current) {
        containerRef.current.removeAttribute("loading");
      }
    });
    return () => abortController.abort();
  }, []);
  return html`
    <style id=${ControlPreview.name}>
      .controlPreview {
        display: flex;
        min-width: 0;
        canvas {
          min-width: 0;
          max-width: 100%;
          height: auto;
          transition: opacity 1s;
        }
      }
      .controlPreview[loading] {
        animation: controlPreviewFlash 1s ease-in-out infinite alternate;
        canvas {
          opacity: 0;
        }
      }
      @keyframes controlPreviewFlash {
        from {
          background-color: color-mix(in srgb, #888 5%, transparent);
        }
        to {
          background-color: color-mix(in srgb, #888 10%, transparent);
        }
      }
    </style>
    <span class="controlPreview" loading ref=${containerRef}>
      <canvas ref=${canvasRef} width=${width} height=${height} />
    </span>
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
  painterName,
  abortSignal,
) {
  // TODO use static images
  const { render } = await import("./render.js");
  await render({
    baybayinUnits,
    viramaStyle,
    arrangement,
    density,
    canvas,
    abortSignal,
    speed: 10,
    composeSteps,
    transparent: true,
    painterName,
  });
}
