import { reaction } from "../lib/mobx.js";
import { BasePainter } from "./painter.js";

const memo = Symbol("memo");

export function installCalligraphy(observableBaybayinUnits, canvasRef) {
  // todo: lazy load
  const painter = new BasePainter();
  reaction(
    () => observableBaybayinUnits.get(),
    async (baybayinUnits) => {
      if (baybayinUnits.length === 0) return;
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.reset();
      context.clearRect(0, 0, canvas.width, canvas.height);
      const glyphMap = await loadGlyphMap();
      drawCalligraphy(baybayinUnits, glyphMap, painter, context);
    },
    { delay: 1000 }
  );
}

async function loadGlyphMap() {
  if (loadGlyphMap[memo]) return loadGlyphMap[memo];

  const map = new Map();
  const glyphArray = (await import("./glyph-map.js")).default;
  for (const glyph of glyphArray) {
    map.set(glyph.name, glyph);
  }

  loadGlyphMap[memo] = map;
  return map;
}

/**
 * @param {string[]} baybayinUnits
 * @param {Map<string, import("../authoring/glyphed.js").Glyph>} glyphMap
 * @param {BasePainter} painter
 * @param {CanvasRenderingContext2D} canvasContext
 */
export async function drawCalligraphy(
  baybayinUnits,
  glyphMap,
  painter,
  canvasContext
) {
  const glyphs = baybayinUnits
    .map((baybayinUnit) => glyphMap.get(baybayinUnit))
    .filter((glyph) => glyph)
    .map(({ nodes, edges }) => ({ nodes, edges }));

  arrangeGlyphs(glyphs, canvasContext);

  const { generatePath } = await import("./generate-path.js");
  const path = generatePath(glyphs[0].nodes, glyphs[0].edges);

  const drawing = painter.drawPath(path, canvasContext);
  for (const step of drawing) {
    await delay(10);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
