import { GIFEncoder, nearestColorIndex, quantize } from "../lib/gifenc.js";
import { createPalette } from "../style/color-styles.js";

const paletteLevels = 11;
const transparentIndex = paletteLevels;
const overlayPaletteSize = 4;

/**
 * @param {CanvasRenderingContext2D} context
 * @param {string} colorStyleName
 * @param {HTMLCanvasElement} [overlay]
 */
export function createGifRecorder(context, colorStyleName, overlay) {
  const { canvas } = context;

  let overlayPalette = [];
  let overlayData = null;
  if (overlay) {
    const overlayPixels = overlay
      .getContext("2d")
      .getImageData(0, 0, overlay.width, overlay.height).data;
    overlayPalette = quantizeOpaquePixels(overlayPixels);
    overlayData = readOverlayData(overlayPixels, overlayPalette);
  }

  // palette = [...colorStyle, transparent, ...overlayPalette]
  const palette = createPalette(colorStyleName, paletteLevels);
  palette[transparentIndex] = [0, 0, 0];
  palette.push(...overlayPalette);
  const colorDepth = Math.ceil(Math.log2(palette.length));

  const gifEncoder = GIFEncoder();
  let prevData = null;
  const writeFrame = (delayMs) => {
    const data = readData(context, overlayData);
    let frameData = data;
    if (prevData !== null) {
      clearUnchanged(prevData, data);
      frameData = prevData;
    }
    gifEncoder.writeFrame(frameData, canvas.width, canvas.height, {
      palette,
      colorDepth,
      transparent: true,
      transparentIndex,
      dispose: 1,
      delay: delayMs,
    });
    prevData = data;
  };

  let prevFrame = -1;
  return {
    recordProgress(progress) {
      const frame = Math.floor(progress / 0.05);
      if (frame <= prevFrame) {
        return;
      }
      writeFrame(83.3333 * (frame - prevFrame));
      prevFrame = frame;
    },
    /** @returns {Uint8Array} GIF bytes */
    finish() {
      writeFrame(300);
      gifEncoder.finish();
      return gifEncoder.bytes();
    },
  };
}

function quantizeOpaquePixels(pixels) {
  const opaquePixels = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] >= 128) {
      opaquePixels.push(pixels[i], pixels[i + 1], pixels[i + 2], 255);
    }
  }
  return quantize(new Uint8Array(opaquePixels), overlayPaletteSize);
}

function readOverlayData(pixels, overlayColors) {
  const overlayData = new Uint8Array(pixels.length / 4);
  for (let i = 0; i < overlayData.length; i++) {
    if (pixels[i * 4 + 3] >= 128) {
      const rgb = [pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]];
      overlayData[i] =
        transparentIndex + 1 + nearestColorIndex(overlayColors, rgb);
    } else {
      overlayData[i] = transparentIndex;
    }
  }
  return overlayData;
}

function readData(context, overlayData) {
  const { width, height } = context.canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  const data = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i++) {
    if (overlayData && overlayData[i] !== transparentIndex) {
      data[i] = overlayData[i];
    } else {
      data[i] = Math.round((pixels[i * 4] * (paletteLevels - 1)) / 255);
    }
  }
  return data;
}

function clearUnchanged(prevData, data) {
  for (let i = 0; i < data.length; i++) {
    if (prevData[i] === data[i]) {
      prevData[i] = transparentIndex;
    } else {
      prevData[i] = data[i];
    }
  }
}
