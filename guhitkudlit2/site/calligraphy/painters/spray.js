import { BasePainter } from "../painter.js";

/**
 * @typedef {import("../path.js").Path} Path
 */

export class SprayPainter extends BasePainter {
  #random;

  constructor(random) {
    super();
    this.#random = random;
  }

  *drawPath(path, scale, color, canvasContext) {
    const vertices = path.vertices;
    if (vertices.length === 0) return;

    const stepLen = scale;

    canvasContext.save();
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
        const x = start.x + dx * progress;
        const y = start.y + dy * progress;
        this.#sprayMist(x, y, 8 * scale, canvasContext);
        edgeProgressLen += stepLen;
      }
      edgeProgressLen -= edgeLen;
      yield i / (vertices.length - 1);
    }
    canvasContext.restore();
  }

  #sprayMist(x, y, radius, canvasContext) {
    for (let i = 0; i < 250; i++) {
      const a = 2 * Math.PI * this.#random();
      const r = this.#random() ** 0.5;
      const cx = Math.sin(a);
      const cy = Math.cos(a);
      const tx = 0.6;
      const ty = 0.4;
      const d = 1 / (Math.hypot(cx - tx, cy - ty) + 1);
      canvasContext.beginPath();
      canvasContext.globalAlpha = 0.01 + 0.04 / d ** 2;
      canvasContext.arc(
        x + (cx + tx) * radius * r,
        y + (cy + ty) * radius * r,
        radius * 0.15 * d,
        0,
        2 * Math.PI,
      );
      canvasContext.fill();
    }
  }
}
