import { DEBUG } from "../app/flags.js";
import { render } from "../canvas/render.js";
import { comparer, computed, reaction } from "../lib/mobx.js";
import { hasVirama } from "../transliteration/syllabicate.js";
import { debounce } from "../util/debounce.js";
import { delay } from "../util/delay.js";
import { createRandom } from "../util/random.js";

const painterLoaders = {
  brush: async () => (await import("./painters/brush.js")).Brush,
  basic: async () => (await import("./painter.js")).BasePainter,
};

async function createPainter(random, painterName) {
  if (painterName) {
    const PainterClass = await painterLoaders[painterName]();
    return new PainterClass(random);
  }
  const debugPainterName = new URL(location).searchParams.get("painter");
  if (DEBUG && debugPainterName) {
    const PainterClass = await painterLoaders[debugPainterName]();
    return new PainterClass(random);
  }
  const Brush = await painterLoaders.brush();
  return new Brush(random);
}

export function installCalligraphy(
  { baybayinUnits, viramaStyle, arrangement, density },
  canvasRef,
  onProgress,
) {
  const inputs = computed(
    () => {
      const b = baybayinUnits.get();
      const v = viramaStyle.get();
      return {
        baybayinUnits: b,
        viramaStyle: hasVirama(b) ? v : "precolonial",
        arrangement: arrangement.get(),
        density: density.get(),
      };
    },
    { equals: comparer.structural },
  );

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
    debounce(async ({ baybayinUnits, viramaStyle, arrangement, density }) => {
      if (baybayinUnits.length === 0) return;
      if (!canvasRef.current) return;
      const abortController = new AbortController();
      drawingAbortController = abortController;
      await render({
        baybayinUnits,
        viramaStyle,
        arrangement,
        density,
        canvas: canvasRef.current,
        abortSignal: abortController.signal,
        speed: calculateSpeed(baybayinUnits),
      });
      if (abortController.signal.aborted) return;
      onProgress("complete");
    }, 400),
    { fireImmediately: true, equals: comparer.shallow },
  );
}

function calculateSpeed(baybayinUnits) {
  const speed = Math.min(20, 1 + Math.round(0.12 * baybayinUnits.length ** 2));

  if (DEBUG) {
    const debugSpeed = Number.parseFloat(
      new URL(location).searchParams.get("speed") ?? 0,
    );
    return Math.ceil(debugSpeed * speed);
  }

  return speed;
}

/**
 * @param {string[]} baybayinUnits
 * @param {CanvasRenderingContext2D} canvasContext
 * @param {AbortSignal} abortSignal
 * @param {object} opts
 * @param {"krus" | "pamudpod" | "precolonial"} opts.viramaStyle
 * @param {"normal" | "grid" | "diamond"} [opts.arrangement]
 * @param {number} [opts.density]
 * @param {number} opts.speed
 * @param {number} [opts.seed]
 * @param {number} [opts.maxComposeSteps]
 * @param {number} [opts.scale]
 * @param {"brush" | "basic"} [opts.painterName]
 * @yields {number} progress [0,1]
 */
export async function* drawCalligraphy(
  baybayinUnits,
  canvasContext,
  abortSignal,
  {
    viramaStyle,
    arrangement,
    density,
    speed,
    seed = 0,
    maxComposeSteps,
    scale,
    painterName,
  },
) {
  const painter = await createPainter(createRandom(seed), painterName);
  const { path, cellSize } = await layoutCalligraphy(
    baybayinUnits,
    canvasContext.canvas,
    { viramaStyle, arrangement, density, maxComposeSteps, scale },
  );
  if (abortSignal.aborted) return;

  let tick = 0;
  const interval = Math.ceil(speed);
  const ms = 1000 / 24 / Math.min(1, speed);
  for (const progress of painter.drawPaths(path, cellSize, canvasContext)) {
    tick++;
    if (tick % interval === 0) {
      await delay(ms);
    }
    if (abortSignal.aborted) return;
    yield progress;
  }
}

/**
 * @param {string[]} baybayinUnits
 * @param {HTMLCanvasElement} canvas
 * @param {object} opts
 * @param {"krus" | "pamudpod" | "precolonial"} opts.viramaStyle
 * @param {"normal" | "grid" | "diamond"} [opts.arrangement]
 * @param {number} [opts.density]
 * @param {number} [opts.maxComposeSteps]
 * @param {number} [opts.scale]
 */
export async function layoutCalligraphy(
  baybayinUnits,
  canvas,
  { viramaStyle, arrangement = "normal", density, maxComposeSteps, scale = 1 },
) {
  const [
    { getGlyph },
    { layoutLine, wrapLines },
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

  const lines = wrapLines(baybayinUnits, arrangement);

  const layout2D = [];
  let lineTopY = 0;
  for (const line of lines) {
    const glyphs = line.map((baybayinUnit) =>
      getGlyph(baybayinUnit, viramaStyle),
    );

    const lineLayout = layoutLine(glyphs, { kern: true, arrangement });
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

  compose(glyphStrokesList, { maxComposeSteps, density });

  const strokes = samplePaths(glyphStrokesList);
  const vertices = strokes.flatMap((stroke) => stroke.vertices);

  const layoutBounds = getBounds(vertices);
  const cellSize =
    scale *
    Math.min(
      canvas.width / (layoutBounds.width + 1),
      canvas.height / (layoutBounds.height + 1),
    );

  const path = strokes.map((stroke) => ({
    vertices: stroke.vertices.map((vertex) => ({
      x: canvas.width / 2 + (vertex.x - layoutBounds.centerX) * cellSize,
      y: canvas.height / 2 + (vertex.y - layoutBounds.centerY) * cellSize,
    })),
  }));

  return { path, cellSize };
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
