import { drawCalligraphy } from "../calligraphy/calligraphy.js";

/**
 * @param {object} params
 * @param {string[]} params.baybayinUnits
 * @param {"krus" | "pamudpod" | "precolonial"} params.viramaStyle
 * @param {"grid" | "diamond"} [params.arrangement]
 * @param {number} [params.density]
 * @param {HTMLCanvasElement} params.canvas
 * @param {AbortSignal} [params.abortSignal]
 * @param {number} params.speed
 * @param {number} [params.composeSteps]
 * @param {number} [params.scale]
 * @param {boolean} [params.transparent]
 * @param {"brush" | "basic" | "flatNib" | "spray"} [params.painterName]
 * @param {(progress: number) => void} [params.onProgress]
 */
export async function render({
  baybayinUnits,
  viramaStyle,
  arrangement,
  density,
  canvas,
  abortSignal = new AbortController().signal,
  speed,
  composeSteps,
  scale,
  transparent,
  painterName,
  onProgress = () => {},
}) {
  const context = canvas.getContext("2d");
  if (!transparent) {
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const progresses = drawCalligraphy(baybayinUnits, context, abortSignal, {
    viramaStyle,
    arrangement,
    density,
    speed,
    maxComposeSteps: composeSteps,
    scale,
    painterName,
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
