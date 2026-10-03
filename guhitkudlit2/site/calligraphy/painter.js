import { DEBUG } from "../app/flags.js";

/**
 * @typedef {import("./stroke.js").Stroke} Stroke
 */

export class BasePainter {
  constructor() {}

  /**
   * @param {Stroke[]} path
   * @param {CanvasRenderingContext2D} canvasContext
   * @yields {void}
   */
  *drawPath(path, canvasContext) {
    const scale =
      Math.min(canvasContext.canvas.width, canvasContext.canvas.height) / 1000;

    for (let i = 0; i < path.length; i++) {
      const color = DEBUG ? `hsl(${(i / path.length) * 360}, 100%, 40%)` : "#000";
      yield* this.drawStroke(path[i], scale, color, canvasContext);
    }
  }

  /**
   * @param {Stroke} stroke
   * @param {number} scale
   * @param {string} color
   * @param {CanvasRenderingContext2D} canvasContext
   * @yields {void}
   */
  *drawStroke(stroke, scale, color, canvasContext) {
    if (stroke.vertices.length === 0) return;

    const brush = {
      x: stroke.vertices[0].x,
      y: stroke.vertices[0].y,
      z: 20,
    };

    canvasContext.lineCap = "round";
    canvasContext.strokeStyle = color;

    let index = 1;
    let limit = 5000;
    while (index < stroke.vertices.length && limit > 0) {
      limit--;

      const vertex = stroke.vertices[index];

      const nextX = vertex.x;
      const nextY = vertex.y;
      const targetZ = Math.hypot(brush.x - nextX, brush.y - nextY) / scale;
      brush.z += (targetZ - brush.z) * 1e-1;
      canvasContext.beginPath();
      canvasContext.moveTo(brush.x, brush.y);
      canvasContext.lineTo(nextX, nextY);
      canvasContext.lineWidth = (600 * scale) / (20 + brush.z);
      yield canvasContext.stroke();
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
