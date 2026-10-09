import { DEBUG } from "../app/flags.js";
import { comparer, computed, reaction } from "../lib/mobx.js";
import { debounce } from "../util/debounce.js";
import { delay } from "../util/delay.js";
import { BasePainter } from "./painter.js";
import { Brush } from "./painters/brush.js";

const painterClasses = { brush: Brush, basic: BasePainter };

function createPainter() {
  const painterName = new URL(location).searchParams.get("painter");
  if (DEBUG && painterName) {
    return new painterClasses[painterName]();
  }
  return new Brush();
}

export function installCalligraphy(
  baybayinUnits,
  viramaStyle,
  canvasRef,
  onProgress,
) {
  // todo: lazy load painter by selected style
  const painter = createPainter();

  const inputs = computed(() => {
    const b = baybayinUnits.get();
    const v = viramaStyle.get();
    const needsVirama = b.some((u) => !u.match(/[aeiou]/));
    console.log({ b, v, needsVirama });
    return {
      baybayinUnits: b,
      viramaStyle: needsVirama ? v : "krus",
    };
  });

  let drawingAbortController;
  reaction(
    () => inputs.get(),
    () => {
      drawingAbortController?.abort();
      onProgress("start");
      if (!canvasRef.current) return;
      const context = canvasRef.current.getContext("2d");
      context.reset();
      context.fillStyle = "#fff";
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    },
    { equals: comparer.shallow },
  );
  reaction(
    () => inputs.get(),
    debounce(async ({ baybayinUnits, viramaStyle }) => {
      if (baybayinUnits.length === 0) return;
      if (!canvasRef.current) return;
      const context = canvasRef.current.getContext("2d");
      const abortController = new AbortController();
      drawingAbortController = abortController;
      await drawCalligraphy(
        baybayinUnits,
        viramaStyle,
        painter,
        context,
        abortController.signal,
      );
      if (abortController.signal.aborted) return;
      onProgress("complete");
    }, 400),
    { fireImmediately: true, equals: comparer.shallow },
  );
}

/**
 * @param {string[]} baybayinUnits
 * @param {"krus" | "pamudpod"} viramaStyle
 * @param {BasePainter} painter
 * @param {CanvasRenderingContext2D} canvasContext
 * @param {AbortSignal} abortSignal
 */
export async function drawCalligraphy(
  baybayinUnits,
  viramaStyle,
  painter,
  canvasContext,
  abortSignal,
) {
  const [
    { getGlyph },
    { layoutLine },
    { traceStrokes },
    { compose },
    { samplePaths },
  ] = await Promise.all([
    import("./glyphs.js"),
    import("./layout.js"),
    import("./stroke.js"),
    import("./compose.js"),
    import("./path.js"),
  ]);
  if (abortSignal.aborted) return;

  const lines = [[]];
  for (const unit of baybayinUnits) {
    if (unit === " ") {
      lines.push([]);
    } else {
      lines.at(-1).push(unit);
    }
  }

  const layout2D = [];
  let lineTopY = 0;
  for (const line of lines) {
    const glyphs = line.map((baybayinUnit) =>
      getGlyph(baybayinUnit, viramaStyle),
    );

    const lineLayout = layoutLine(glyphs);
    const lineVertices = lineLayout
      .flatMap((glyph) => glyph.map.flat())
      .filter((vertex) => vertex);
    const lineBounds = getBounds(lineVertices);
    for (const vertex of lineVertices) {
      vertex.x -= lineBounds.centerX;
      vertex.y += lineTopY - lineBounds.minY;
    }
    layout2D.push(...lineLayout);
    lineTopY += lineBounds.height;
  }

  const glyphStrokesList = layout2D.map(traceStrokes);

  compose(glyphStrokesList);

  const strokes = samplePaths(glyphStrokesList);
  const vertices = strokes.flatMap((stroke) => stroke.vertices);

  const layoutBounds = getBounds(vertices);
  const cellSize = Math.min(
    canvasContext.canvas.width / (layoutBounds.width + 1),
    canvasContext.canvas.height / (layoutBounds.height + 1),
  );

  const path = strokes.map((stroke) => ({
    vertices: stroke.vertices.map((vertex) => ({
      x:
        canvasContext.canvas.width / 2 +
        (vertex.x - layoutBounds.centerX) * cellSize,
      y:
        canvasContext.canvas.height / 2 +
        (vertex.y - layoutBounds.centerY) * cellSize,
    })),
  }));

  let drawStep = 0;
  const drawInterval = DEBUG
    ? 0
    : Math.min(20, 1 + Math.round(0.1 * baybayinUnits.length ** 2));
  for (const _ of painter.drawPaths(path, cellSize, canvasContext)) {
    if (drawStep++ % drawInterval === 0) await delay(22);
    if (abortSignal.aborted) return;
  }
}

function getBounds(vertices) {
  const minX = Math.min(...vertices.map((vertex) => vertex.x));
  const maxX = Math.max(...vertices.map((vertex) => vertex.x));
  const minY = Math.min(...vertices.map((vertex) => vertex.y));
  const maxY = Math.max(...vertices.map((vertex) => vertex.y));
  return {
    minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}
