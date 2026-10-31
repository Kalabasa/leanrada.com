import { drawCalligraphy } from "../calligraphy/calligraphy.js";
import { applyColorStyle } from "../style/color-styles.js";

const logoUrl = new URL("../app/logo.svg", import.meta.url).href;

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
 * @param {string} [params.colorStyleName]
 * @param {boolean} [params.logo]
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
  colorStyleName,
  logo = false,
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
  if (canvas.width >= 300 || canvas.height >= 300) {
    drawUrl(canvas);
  }
  if (colorStyleName !== undefined) {
    applyColorStyle(context, colorStyleName);
  }
  if (logo) {
    await stampLogo(canvas);
  }
}

export async function stampLogo(canvas) {
  const logoImage = new Image();
  logoImage.src = logoUrl;
  await logoImage.decode();
  const logoHeight = 30;
  const logoWidth =
    (logoHeight * logoImage.naturalWidth) / logoImage.naturalHeight;
  canvas
    .getContext("2d")
    .drawImage(
      logoImage,
      canvas.width - logoWidth,
      canvas.height - logoHeight,
      logoWidth,
      logoHeight,
    );
}

function drawUrl(canvas) {
  const text = atob("TGVhblJhZGEuY29tL0d1aGl0LUt1ZGxpdA==").toUpperCase();
  const context = canvas.getContext("2d");
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const scale = Math.max(6, Math.min(15, canvas.width * 0.007));

  context.save();
  context.font = `bold ${scale}px Georgia, "Noto Serif", serif`;
  context.letterSpacing = `${scale * 0.08}px`;
  context.fillStyle = "#000";
  context.globalAlpha = 0.05;
  context.textBaseline = "bottom";

  const contourY = [];
  for (let x = 0; x < canvas.width; x++) {
    contourY.push(findContourY(pixels, canvas.width, canvas.height, x));
  }

  const chars = [];
  for (let i = 0; i < text.length; i++) {
    const leftX = context.measureText(text.slice(0, i)).width;
    const charWidth = context.measureText(text[i]).width;
    chars.push({
      char: text[i],
      leftX,
      centerX: Math.round(leftX + charWidth / 2),
    });
  }

  const textWidth = context.measureText(text).width;
  const maxStartX = Math.max(0, Math.floor(canvas.width - textWidth));
  let bestChars = null;
  let bestCost = Infinity;
  for (let x = 0; x <= maxStartX; x++) {
    const placedChars = placeChars(chars, contourY, x);
    if (placedChars === null) continue;

    const charYs = placedChars.map((c) => c.y);
    const extentY = Math.max(...charYs) - Math.min(...charYs);
    const gaps = chars.filter(
      (c) => (contourY[x + c.centerX] ?? null) === null,
    ).length;

    const cost = extentY + gaps * 20;
    if (cost < bestCost) {
      bestCost = cost;
      bestChars = placedChars;
    }
  }
  if (bestChars === null) {
    context.restore();
    return;
  }

  for (const c of bestChars) {
    context.fillText(c.char, c.x, c.y - scale * 0.08);
  }
  context.restore();
}

function findContourY(pixels, width, height, x) {
  for (let y = 0; y < height; y++) {
    const offset = (y * width + x) * 4;
    const blackness =
      ((pixels[offset + 3] / 255) *
        (255 -
          Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]))) /
      255;
    if (blackness >= 0.5) return y;
  }
  return null;
}

function placeChars(chars, contourYs, startX) {
  const charYs = chars.map((c) => contourYs[startX + c.centerX] ?? null);
  if (charYs.every((y) => y === null)) return null;
  return chars.map((c, i) => ({
    char: c.char,
    x: startX + c.leftX,
    y: lerpY(charYs, i),
  }));
}

function lerpY(charYs, index) {
  if (charYs[index] !== null) {
    return charYs[index];
  }
  const prevIndex = charYs.findLastIndex((y, i) => i < index && y !== null);
  const nextIndex = charYs.findIndex((y, i) => i > index && y !== null);
  if (prevIndex === -1) {
    return charYs[nextIndex];
  }
  if (nextIndex === -1) {
    return charYs[prevIndex];
  }
  const t = (index - prevIndex) / (nextIndex - prevIndex);
  const prevY = charYs[prevIndex];
  const nextY = charYs[nextIndex];
  return prevY + (nextY - prevY) * t;
}
