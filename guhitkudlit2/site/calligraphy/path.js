/**
 * @typedef {import("./stroke.js").GlyphStrokes} GlyphStrokes
 * @typedef {import("./stroke.js").StrokeVertex} StrokeVertex
 * @typedef {{
 *  vertices: { x: number, y: number }[],
 *  isKudlit: boolean
 * }} Path
 */

/**
 * @param {GlyphStrokes[]} glyphStrokesList
 * @returns {Path[]}
 */
export function samplePaths(glyphStrokesList) {
  return glyphStrokesList.flatMap(({ strokes }) =>
    strokes.map((stroke) => ({
      vertices: sampleVertices(stroke.vertices),
      isKudlit: stroke.isKudlit,
    })),
  );
}

const samplesPerEdge = 8;

/**
 * @param {StrokeVertex[]} vertices
 * @returns {{ x: number, y: number }[]}
 */
function sampleVertices(vertices) {
  const out = [{ ...vertices[0].position }];
  for (let i = 1; i < vertices.length; i++) {
    const start = vertices[i - 1];
    const end = vertices[i];
    const startHandle = {
      x: start.position.x + start.control.x,
      y: start.position.y + start.control.y,
    };
    const endHandle = {
      x: end.position.x - end.control.x,
      y: end.position.y - end.control.y,
    };
    for (let sample = 1; sample < samplesPerEdge; sample++) {
      const t = sample / samplesPerEdge;
      out.push(
        sampleCubicBezier(
          start.position,
          startHandle,
          endHandle,
          end.position,
          t,
        ),
      );
    }
    out.push({ ...end.position });
  }
  return out;
}

/**
 * @param {{ x: number, y: number }} start
 * @param {{ x: number, y: number }} startHandle
 * @param {{ x: number, y: number }} endHandle
 * @param {{ x: number, y: number }} end
 * @param {number} t
 * @returns {{ x: number, y: number }}
 */
function sampleCubicBezier(start, startHandle, endHandle, end, t) {
  const startWeight = (1 - t) ** 3;
  const startHandleWeight = 3 * (1 - t) ** 2 * t;
  const endHandleWeight = 3 * (1 - t) * t ** 2;
  const endWeight = t ** 3;
  return {
    x:
      start.x * startWeight +
      startHandle.x * startHandleWeight +
      endHandle.x * endHandleWeight +
      end.x * endWeight,
    y:
      start.y * startWeight +
      startHandle.y * startHandleWeight +
      endHandle.y * endHandleWeight +
      end.y * endWeight,
  };
}
