import * as glyphMap from "./glyphs.js";

/*
LEGEND
  . vertex
  * explicit terminal vertex
  | vertical line
  - horizontal line
  s vertical wavy
  ~ horizontal wavy
  / rising diagonal
  x falling diagonal
  ) vertical right curve
  ( vertical left curve

Vertices can only be entered in odd columns and odd lines.
*/

export const A = glyph(
  { xScale: 1 },
  `
.-. .-.
  | |
.-. .
  |/
  .
`,
);
export const I = glyph(
  { xScale: 2 },
  `
  

.-.  

.~.
`,
);
export const U = glyph(
  { xScale: 2 },
  `
.
)
.
)
.
`,
);
export const B = glyph(
  { xScale: 4 / 3 },
  `
.---. 
|   |
.   .
|   |
.-*-.
`,
);
B.map[1][0].x += 0.6;
B.map[1][2].x -= 0.6;
B.map[3][0].x += 0.25;
B.map[3][1].y -= 0.5;
B.map[3][2].x -= 0.25;
export const K = glyph(
  { xScale: 4 / 3 },
  `
.-.-.
  |
  |
  |
.-.-.
`,
);
export const D = glyph(
  { xScale: 1 },
  `
.-.---.
  |
  .
  |
  .---.
`,
);
export const G = glyph(
  { xScale: 4 / 3 },
  `
. .
)/|
. |
) |
. .-.
`,
);
export const H = glyph(
  { xScale: 4 / 3 },
  `


.-.-.


`,
);
export const L = glyph(
  { xScale: 4 / 3 },
  `
.-.-.
  s
  s
  s
  .
`,
);
export const M = glyph(
  { xScale: 1 },
  `
.-. .-.
  | |
  .-.
  |/
  .
`,
);
export const N = glyph(
  { xScale: 4 / 3 },
  `
  .  
 /sx 
. s .
| s |
. . .
`,
);
export const NG = glyph(
  { xScale: 1 },
  `
.-.
  |
  .~~~.
  | 
.-.
`,
);
NG.map[1][1].x -= 0.5;
NG.map[1][1].y += 0.25;
NG.map[3][1].x -= 0.5;
NG.map[3][1].y -= 0.25;
export const P = glyph(
  { xScale: 1 },
  `
.-. .-.
  | |
  | .-.
  |/
  .
`,
);
export const S = glyph(
  { xScale: 0.8 },
  `
.-.   .
  |  /)
  | / .
  |/  )
  .   .
`,
);
export const T = glyph(
  { xScale: 1 },
  `


.-.---.
 /
.
`,
);
export const W = glyph(
  { xScale: 0.8 },
  `
.-. .-.
  |   |
  |   .
  |  /
  .-/
`,
);
export const Y = glyph(
  { xScale: 1 },
  `
.-. .-.
  | |
  | .
  |/
  .
`,
);

const cache = new Map();

export function getGlyph(baybayinUnit) {
  let glyph = cache.get(baybayinUnit);
  if (!glyph) {
    glyph = createGlyph(baybayinUnit);
    cache.set(baybayinUnit, glyph);
  }
  return glyph;
}

function createGlyph(baybayinUnit) {
  const glyphName = baybayinUnit.startsWith("ng")
    ? "NG"
    : baybayinUnit.slice(0, 1).toUpperCase();
  const baseGlyph = glyphMap[glyphName];

  const isVowel = "aeiou".includes(baybayinUnit[0]);
  if (isVowel) return baseGlyph;

  const vowel = baybayinUnit.at(-1);
  if (vowel === "a") return baseGlyph;

  const glyph = structuredClone(baseGlyph);
  if (!"eiou".includes(vowel)) {
    addVirama(glyph);
    return glyph;
  }

  addKudlit(glyph, vowel);
  return glyph;
}

function addKudlit(glyph, vowel) {
  let kudlitRow, y;
  if ("ei".includes(vowel)) {
    kudlitRow = 0;
    y = 0.5;
  } else {
    kudlitRow = 4;
    y = 3.5;
  }

  const centerX = (glyph.map[1].length - 1) / 2;
  const kudlitLeft = {
    x: centerX - 0.25,
    y,
    terminal: false,
    isKudlit: true,
    adjacency: new Map(),
  };
  const kudlitRight = {
    x: centerX + 0.25,
    y,
    terminal: false,
    isKudlit: true,
    adjacency: new Map(),
  };
  kudlitLeft.adjacency.set(kudlitRight, { type: undefined });
  kudlitRight.adjacency.set(kudlitLeft, { type: undefined });
  glyph.map[kudlitRow] = [kudlitLeft, kudlitRight];
}

function addVirama(glyph) {
  const rightX = glyph.map[1].length - 1;
  const centerX = rightX / 2;
  const viramaStart = {
    x: rightX + 0.5,
    y: 2,
    terminal: false,
    isKudlit: true,
    adjacency: new Map(),
  };
  const viramaMiddle = {
    x: (rightX + centerX) / 2 + 0.25,
    y: 3.35,
    terminal: false,
    isKudlit: true,
    adjacency: new Map(),
  };
  const viramaEnd = {
    x: centerX,
    y: 3.5,
    terminal: false,
    isKudlit: true,
    adjacency: new Map(),
  };
  viramaStart.adjacency.set(viramaMiddle, { type: undefined });
  viramaMiddle.adjacency.set(viramaStart, { type: undefined });
  viramaMiddle.adjacency.set(viramaEnd, { type: undefined });
  viramaEnd.adjacency.set(viramaMiddle, { type: undefined });
  glyph.map[4] = [viramaStart, viramaMiddle, viramaEnd];
}

/**
 * @typedef {{
 *  x: number,
 *  y: number,
 *  terminal: boolean,
 *  isKudlit?: boolean,
 *  adjacency: Map<GlyphVertex, {
 *    type: 'wavy' | 'leftCurve' | 'rightCurve' | undefined,
 *    control?: { dx: number, dy: number }
 *  }>
 * }} GlyphVertex
 * @typedef {{ xScale: number; map: (GlyphVertex | undefined)[][] }} Glyph
 *
 * @returns {Glyph} a glyph
 */
function glyph({ xScale }, data) {
  data = data.replaceAll(/^\n|\n$/g, "");
  const charGrid = data.split("\n").map((line) => line.trimEnd());
  const width = Math.max(...charGrid.map((line) => Math.ceil(line.length / 2)));
  const grid = Array.from({ length: 5 }, () => Array.from({ length: width }));
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < width; x++) {
      const vertexChar = charGrid[y * 2]?.[x * 2];
      if (vertexChar === "." || vertexChar === "*") {
        grid[y + 1][x] = {
          x,
          y: y + 1,
          terminal: vertexChar === "*",
          adjacency: new Map(),
        };
      }
    }
  }
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < width; x++) {
      const vertex = grid[y + 1][x];
      if (vertex) {
        for (const connection of findConnections(charGrid, x, y)) {
          const other = grid[connection.y + 1][connection.x];
          vertex.adjacency.set(other, { type: connection.type });
          other.adjacency.set(vertex, { type: connection.type });
        }
      }
    }
  }
  return { xScale, map: grid };
}

function* findConnections(charGrid, gridX, gridY) {
  let queue = [{ x: gridX * 2, y: gridY * 2 }];

  while (queue.length) {
    const current = queue.pop();
    const { x, y, prev } = current;
    const px = prev && prev.x - x;
    const py = prev && prev.y - y;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const char = charGrid[y][x];
        const isHorizontal = "-~".includes(char);
        const isVertical = "|s()".includes(char);
        if (isHorizontal && (dx === 0 || dx === px)) continue;
        if (isVertical && (dy === 0 || dy === py)) continue;
        if (
          char === "/" &&
          (dx === dy || Math.sign(dx - dy) === Math.sign(px - py))
        )
          continue;
        if (
          char === "x" &&
          (dx === -dy || Math.sign(dx + dy) === Math.sign(px + py))
        )
          continue;

        let type = current.type;
        if (!type) {
          if ("~s".includes(char)) type = "wavy";
          else if ("(" === char) type = "leftCurve";
          else if (")" === char) type = "rightCurve";
        }

        const nextCharX = x + dx;
        const nextCharY = y + dy;
        if (nextCharY < 0) continue;
        if (nextCharY >= charGrid.length) continue;
        const charRow = charGrid[nextCharY];
        if (nextCharX < 0) continue;
        if (nextCharX >= charRow.length) continue;
        const nextChar = charRow[nextCharX];

        if (
          ".*".includes(nextChar) &&
          (!isHorizontal || dy === 0) &&
          (!isVertical || dx === 0) &&
          (char !== "/" || dx === -dy) &&
          (char !== "x" || dx === dy)
        ) {
          yield {
            x: Math.floor(nextCharX / 2),
            y: Math.floor(nextCharY / 2),
            type,
          };
        } else if (
          ("-~".includes(nextChar) &&
            dx !== 0 &&
            !isVertical &&
            (!".*".includes(char) || dy === 0)) ||
          ("|s".includes(nextChar) &&
            dy !== 0 &&
            !isHorizontal &&
            (!".*".includes(char) || dx === 0)) ||
          ("()".includes(nextChar) && dx === 0) ||
          ("/".includes(nextChar) && dx !== dy) ||
          ("x".includes(nextChar) && dx !== -dy)
        ) {
          queue.push({ x: nextCharX, y: nextCharY, type, prev: current });
        }
      }
    }
  }
}
