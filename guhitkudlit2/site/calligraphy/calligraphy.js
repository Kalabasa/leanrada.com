import { reaction } from "../lib/mobx.js";
import { delay } from "../util/delay.js";
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
    .map((baybayinUnit) => generateGlyph(baybayinUnit, glyphMap))
    .filter((glyph) => glyph);
  console.log(glyphs);

  // arrangeGlyphs(glyphs, canvasContext);

  const { generatePath } = await import("./generate-path.js");
  const path = generatePath(glyphs[0].nodes, glyphs[0].edges);

  const drawing = painter.drawPath(path, canvasContext);
  for (const step of drawing) {
    await delay(10);
  }
}

function generateGlyph(baybayinUnit, glyphMap) {
  const consonant =
    baybayinUnit === "ng" ? baybayinUnit : baybayinUnit.slice(0, 1);
  const consonantGlyph = glyphMap.get(consonant);
  if (!consonantGlyph) return null;
  // todo: kudlit
  return { nodes: consonantGlyph.nodes, edges: consonantGlyph.edges };
}
