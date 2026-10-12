import { BasePainter } from "../painter.js";

/**
 * @typedef {import("../path.js").Path} Path
 */

const dropletsPerStep = 40;

export class SprayPainter extends BasePainter {
  #random;

  /**
   * @param {() => number} random
   */
  constructor(random) {
    super();
    this.#random = random;
  }

  /**
   * @param {Path} path
   * @param {number} scale
   * @param {string} color
   * @param {CanvasRenderingContext2D} canvasContext
   * @yields {number} progress [0,1]
   */
  *drawPath(path, scale, color, canvasContext) {
    const sprayRadius = 8 * scale;
    const dropletRadius = 0.4 * scale;
    const stepLen = scale;
    const vertices = path.vertices;

    canvasContext.fillStyle = color;

    let edgeProgressLen = 0;
    for (let i = 1; i < vertices.length; i++) {
      const start = vertices[i - 1];
      const end = vertices[i];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const edgeLen = Math.hypot(dx, dy);
      while (edgeProgressLen < edgeLen) {
        const progress = edgeProgressLen / edgeLen;
        this.#sprayDroplets(
          start.x + dx * progress,
          start.y + dy * progress,
          sprayRadius,
          dropletRadius,
          canvasContext,
        );
        edgeProgressLen += stepLen;
      }
      edgeProgressLen -= edgeLen;
      yield i / (vertices.length - 1);
    }
  }

  #sprayDroplets(nozzleX, nozzleY, sprayRadius, dropletRadius, canvasContext) {
    canvasContext.beginPath();
    for (let i = 0; i < dropletsPerStep; i++) {
      const distance = sprayRadius * this.#random();
      const angle = 2 * Math.PI * this.#random();
      const dropletX = nozzleX + distance * Math.cos(angle);
      const dropletY = nozzleY + distance * Math.sin(angle);
      canvasContext.moveTo(dropletX + dropletRadius, dropletY);
      canvasContext.arc(dropletX, dropletY, dropletRadius, 0, 2 * Math.PI);
    }
    canvasContext.fill();
  }
}
