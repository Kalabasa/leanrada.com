import { drawCalligraphy } from "../calligraphy/calligraphy.js";

/**
 * @param {object} params
 * @param {string[]} params.baybayinUnits
 * @param {"krus" | "pamudpod"} params.viramaStyle
 * @param {HTMLCanvasElement} params.canvas
 * @param {AbortSignal} [params.abortSignal]
 * @param {number} [params.speedFactor]
 * @param {(progress: number) => void} [params.onProgress]
 */
export async function render({
  baybayinUnits,
  viramaStyle,
  canvas,
  abortSignal = new AbortController().signal,
  speedFactor = 1,
  onProgress = () => {},
}) {
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const progresses = drawCalligraphy(baybayinUnits, context, abortSignal, {
    viramaStyle,
    speedFactor,
  });
  let latestProgress = 0;
  let pendingFrameId = null;
  for await (const progress of progresses) {
    latestProgress = progress;
    if (pendingFrameId === null) {
      pendingFrameId = requestAnimationFrame(() => {
        pendingFrameId = null;
        onProgress(latestProgress);
      });
    }
  }
  if (pendingFrameId !== null) {
    cancelAnimationFrame(pendingFrameId);
    onProgress(latestProgress);
  }
}
