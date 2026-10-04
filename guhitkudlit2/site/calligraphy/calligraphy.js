import { reaction } from "../lib/mobx.js";
import { delay } from "../util/delay.js";
import { BasePainter } from "./painter.js";
/*

Each glyph is subdivided into a grid. 3 rows, variable columns. Each cell can contain one vertex.

For example, glyph ᜀ (A) is structured as a 4x3 grid:

  .................
  :   :   :   :   :
  : o---o : o---o :
  :...:.|.:.|.:...:
  :   : | : | :   :
  : o---o : o :   :
  :...:.|.:/..:...:
  :   : | /   :   :
  :   : o/:   :   :
  :...:...:...:...:

Vertices can be connected. Edges have properties.

An edge could be plain (as inᜑ), wavy (as in ᜁ, ᜎ), or curved (as in ᜐ, ᜂ, ᜄ).

A wavy edge could have wave frequency parameter.

A curved edge could have a radius or direction parameter.

Cell occupancy could be used for kerning.

    A  +   PA
  #### >> ..##
  ###. << ####
  .#..    .#..

Subsets of vertices could be shifted up or down to make adjacent glyphs fit better.

   A (shifted)      +  K
  .................   ....
  :   :   :   :   :   :
  : o---o :   :   : <<: o-
  :...:.|.:...:...:   :...
  :   : | :   :   :   :
  : o---o : o---o :>> :
  :...:.|.:.|.:...:   :...
  :   : | : | :   :   :
  :   : o---o :   : <<: o-
  :...:...:...:...:   :...

    A  +  KA
  ##.. << ###
  #### >> .#.
  .##. << ###

Whole glyphs could be shifted up or down in cell grid increments.

    A  +  KA
  .... << ###
  #### >> .#.
  ###. << ###
  .#..    ...

Glyphs are laid out in a global grid using the above rules to create a tight composition.

The resulting graph describes the basic skeleton of a glyph which will be the basis for the brush strokes.

*/

const memo = Symbol("memo");

export function installCalligraphy(observableBaybayinUnits, canvasRef) {
  // todo: lazy load
  const painter = new BasePainter();
  let drawingAbortController = new AbortController();
  reaction(
    () => observableBaybayinUnits.get(),
    async (baybayinUnits) => {
      drawingAbortController.abort();
      drawingAbortController = new AbortController();
      if (baybayinUnits.length === 0) return;
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.reset();
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawCalligraphy(
        baybayinUnits,
        painter,
        context,
        drawingAbortController.signal,
      );
    },
    { delay: 1000 },
  );
}

/**
 * @param {string[]} baybayinUnits
 * @param {BasePainter} painter
 * @param {CanvasRenderingContext2D} canvasContext
 * @param {AbortSignal} abortSignal
 */
export async function drawCalligraphy(
  baybayinUnits,
  painter,
  canvasContext,
  abortSignal,
) {
  const [
    glyphMap,
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
      getGlyph(baybayinUnit, glyphMap),
    );

    const lineLayout = layoutLine(glyphs, { kern: false });
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

  const drawing = painter.drawPath(path, canvasContext);
  for (const _ of drawing) {
    await delay(10);
    if (abortSignal.aborted) return;
  }
}

function getGlyph(baybayinUnit, glyphMap) {
  const glyphName = baybayinUnit.startsWith("ng")
    ? "NG"
    : baybayinUnit.slice(0, 1).toUpperCase();
  // todo: add kudlit & memoize
  return glyphMap[glyphName];
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
