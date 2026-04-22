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
  reaction(
    () => observableBaybayinUnits.get(),
    async (baybayinUnits) => {
      if (baybayinUnits.length === 0) return;
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.reset();
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawCalligraphy(baybayinUnits, painter, context);
    },
    { delay: 1000 }
  );
}

/**
 * @param {string[]} baybayinUnits
 * @param {BasePainter} painter
 * @param {CanvasRenderingContext2D} canvasContext
 */
export async function drawCalligraphy(
  baybayinUnits,
  painter,
  canvasContext
) {
  throw new "Not implemented";
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

function generateGlyph(baybayinUnit) {
  const consonant =
    baybayinUnit === "ng" ? baybayinUnit : baybayinUnit.slice(0, 1);
  const consonantGlyph = glyphMap.get(consonant);
  if (!consonantGlyph) return null;
  // todo: kudlit
  return { nodes: consonantGlyph.nodes, edges: consonantGlyph.edges };
}
