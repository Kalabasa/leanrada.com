import { BasePainter } from "../painter.js";
import { createNoise2D } from "../../lib/simplex-noise.js";

/**
 * @typedef {import("../path.js").Path} Path
 */

const bristleCount = 80;
const sampleNoise2D = createNoise2D();

const bristles = Array.from({ length: bristleCount }, () => {
  const r = Math.sqrt(Math.random());
  const a = Math.random() * 2 * Math.PI;
  return {
    x: r * Math.cos(a),
    y: r * Math.sin(a),
    ink: 0.2 + 0.4 * Math.random(),
    length: 1 - r - 0.4 * Math.random(),
  };
});

export class Brush extends BasePainter {
  /**
   * @param {Path} path
   * @param {number} scale
   * @param {string} color
   * @param {CanvasRenderingContext2D} canvasContext
   * @yields {void}
   */
  *drawPath(path, scale, color, canvasContext) {
    const maxRadius = 10 * scale;
    const vertices = path.vertices;
    const initVertex = vertices[0];
    const finalVertex = vertices.at(-1);

    canvasContext.strokeStyle = color;
    canvasContext.lineCap = "round";

    let z = -0.5;
    let zVel = 0;
    let speed = 0;

    let edgeIndex = 1;
    let edgeProgressLen = 0;
    /** @type {{ x: number, y: number } | null} */
    let prev = null;
    while (edgeIndex < vertices.length) {
      const start = vertices[edgeIndex - 1];
      const end = vertices[edgeIndex];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const edgeLen = Math.hypot(dx, dy);
      if (edgeLen === 0 || edgeProgressLen > edgeLen) {
        edgeProgressLen -= edgeLen;
        edgeIndex++;
        yield;
        continue;
      }
      const progress = edgeProgressLen / edgeLen;
      const brushX = start.x + dx * progress;
      const brushY = start.y + dy * progress;
      const dirX = dx / edgeLen;
      const dirY = dy / edgeLen;

      const distFromInit = Math.hypot(
        initVertex.x - brushX,
        initVertex.y - brushY,
      );
      const distFromFinal = Math.hypot(
        finalVertex.x - brushX,
        finalVertex.y - brushY,
      );
      // press brush in these directions
      const directionBias =
        0.5 +
        0.5 *
          Math.max(
            // dot product w/ down
            dirY,
            // dot product w/ 30 degrees up from negative x
            -(Math.sqrt(3) / 2) * dirX - 0.5 * dirY,
          );
      const distThreshold = 60;
      const targetZ =
        -Math.min(1, Math.max(1 / distFromInit, distFromFinal / (distThreshold * scale))) *
        (0.5 + 0.5 * directionBias);
      zVel += (targetZ - z) * 0.005 - zVel * 0.14;
      z += zVel;

      let straightness = 1;
      if (prev) {
        const stepDx = brushX - prev.x;
        const stepDy = brushY - prev.y;
        const stepLen = Math.hypot(stepDx, stepDy);
        if (stepLen > 0) {
          straightness = (stepDx * dx + stepDy * dy) / (stepLen * edgeLen);
        }
      }
      speed += (1 + 3 * Math.max(0, straightness) - speed) * 0.05;

      if (prev) {
        for (const bristle of bristles) {
          const spread = Math.max(0, bristle.length * 0.5 - z);
          const bristleX = maxRadius * bristle.x * spread;
          const bristleY = maxRadius * bristle.y * spread;
          const x = brushX + bristleX;
          const y = brushY + bristleY;

          const strength =
            bristle.length -
            1 -
            z +
            bristle.ink * Math.min(1, 1.2 / speed) -
            0.1 * sampleNoise2D(x / scale, y / scale);

          if (strength <= 0) continue;

          canvasContext.lineWidth = 0.8 * maxRadius * strength;
          canvasContext.beginPath();
          canvasContext.moveTo(prev.x + bristleX, prev.y + bristleY);
          canvasContext.lineTo(x, y);
          canvasContext.stroke();
        }
      }
      prev = { x: brushX, y: brushY };
      edgeProgressLen += maxRadius / 30;
    }
  }
}
