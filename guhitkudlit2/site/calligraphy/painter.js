import { DEBUG } from "../app/flags.js";

/**
 * @typedef {import("./path.js").Path} Path
 */

export class BasePainter {
  constructor() {}

  /**
   * @param {Path[]} paths
   * @param {number} scale
   * @param {CanvasRenderingContext2D} canvasContext
   * @yields {number} progress [0,1]
   */
  *drawPaths(paths, scale, canvasContext) {
    const strokeScale = scale / 40;

    for (let i = 0; i < paths.length; i++) {
      const color =
        DEBUG && new URLSearchParams(location.search).has("colorize")
          ? `hsl(${(i / paths.length) * 360}, 100%, 40%)`
          : "#000";
      for (const pathProgress of this.drawPath(
        paths[i],
        strokeScale,
        color,
        canvasContext,
      )) {
        yield (i + pathProgress) / paths.length;
      }
    }
  }

  /**
   * @param {Path} path
   * @param {number} scale
   * @param {string} color
   * @param {CanvasRenderingContext2D} canvasContext
   * @yields {number} progress [0,1]
   */
  *drawPath(path, scale, color, canvasContext) {
    if (path.vertices.length === 0) return;

    const brush = {
      x: path.vertices[0].x,
      y: path.vertices[0].y,
      z: 20,
    };

    canvasContext.lineCap = "round";
    canvasContext.strokeStyle = color;

    let index = 1;
    let limit = 5000;
    while (index < path.vertices.length && limit > 0) {
      limit--;

      const vertex = path.vertices[index];

      const nextX = vertex.x;
      const nextY = vertex.y;
      const targetZ = Math.hypot(brush.x - nextX, brush.y - nextY) / scale;
      brush.z += (targetZ - brush.z) * 1e-1;
      canvasContext.beginPath();
      canvasContext.moveTo(brush.x, brush.y);
      canvasContext.lineTo(nextX, nextY);
      canvasContext.lineWidth = (400 * scale) / (20 + brush.z);
      canvasContext.stroke();
      yield index / (path.vertices.length - 1);
      brush.x = nextX;
      brush.y = nextY;

      if (
        Math.hypot(vertex.x - brush.x, vertex.y - brush.y) <=
        canvasContext.lineWidth
      ) {
        index++;
      }
    }
  }
}
