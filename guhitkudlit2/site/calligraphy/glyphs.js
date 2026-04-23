/*
LEGEND
  . vertex
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

export const A = glyph`
.-. .-.
  | |
.-. .
  |/
  .
`;
export const I = glyph`
.-.



.~.
`;
export const U = glyph`
.
)
.
)
.
`;
export const B = glyph`
  . 
 / x 
| . |
|/ x|
.   .
`;
export const K = glyph`
.-.-.
  |
  |
  |
.-.-.
`;
export const D = glyph`
.-.-.
  |
  |
  |
  .-.
`;
export const G = glyph`
. .
)/|
. |
) |
. .-.
`;
export const H = glyph`


.-.


`;
export const L = glyph`
.-.-.
  s
  s
  s
  .
`;
export const M = glyph`
.-. .-.
  | |
  .-.
  |/
  .
`;
export const N = glyph`
.-.-.
| s |
| s |
| s |
. . .
`;
export const P = glyph`
.-. .-.
  | |
  . .-.
  |/
  .
`;
export const S = glyph`
.-.   .
  |  /)
  . / .
  |/  )
  .   .
`;
export const T = glyph`


.-.-.
 /
.
`;
export const W = glyph`
.-. .-.
  |   |
  .   .
  |  /
  .-/
`;
export const Y = glyph`
.-. .-.
  | |
  . .
  |/
  .
`;

/**
 * @typedef {{
 *  x: number,
 *  y: number,
 *  adjacency: Set<Vertex, { type: 'wavy' | 'leftCurve' | 'rightCurve' | undefined }>
 * }} GlyphVertex
 * @typedef {(GlyphVertex | undefined)[][]} Glyph
 * 
 * @returns {Glyph} a glyph
 */
function glyph([data]) {
  data = data.replaceAll(/^\n|\n$/g, "");
  const charGrid = data.split("\n").map((line) => line.trimEnd());
  const width = Math.max(...charGrid.map((line) => Math.ceil(line.length / 2)));
  const grid = Array.from({ length: 3 }, () => Array.from({ length: width }));
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < width; x++) {
      if (charGrid[y * 2]?.[x * 2] === ".") {
        grid[y][x] = { x, y, adjacency: new Map() };
      }
    }
  }
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < width; x++) {
      const vertex = grid[y][x];
      if (vertex) {
        for (const connection of findConnections(charGrid, x, y)) {
          const other = grid[connection.y][connection.x];
          const edge = { type: connection.type };
          vertex.adjacency.set(other, edge);
          other.adjacency.set(vertex, edge);
        }
      }
    }
  }
  return grid;
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
          "." === nextChar &&
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
            (char !== "." || dy === 0)) ||
          ("|s".includes(nextChar) &&
            dy !== 0 &&
            !isHorizontal &&
            (char !== "." || dx === 0)) ||
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
