import { drawCalligraphy } from "../calligraphy/calligraphy.js";

/**
 * @param {object} params
 * @param {string[]} params.baybayinUnits
 * @param {"krus" | "pamudpod"} params.viramaStyle
 * @param {HTMLCanvasElement} params.canvas
 * @param {AbortSignal} [params.abortSignal]
 * @param {number} [params.speedFactor]
 */
export async function render({
  baybayinUnits,
  viramaStyle,
  canvas,
  abortSignal = new AbortController().signal,
  speedFactor = 1,
}) {
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await drawCalligraphy(baybayinUnits, context, abortSignal, {
    viramaStyle,
    speedFactor,
  });
}
