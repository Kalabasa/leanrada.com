import { BasePainter } from "../painter.js";

/**
 * @typedef {import("../path.js").Path} Path
 */

const nibAngle = -Math.PI / 6;
const pressAngle = Math.PI / 8;

export class FlatNib extends BasePainter {
  /**
   * @param {Path} path
   * @param {number} scale
   * @param {string} color
   * @param {CanvasRenderingContext2D} canvasContext
   * @yields {number} progress [0,1]
   */
  *drawPath(path, scale, color, canvasContext) {
    const maxRadius = 8 * scale;
    const pressDirX = Math.cos(pressAngle);
    const pressDirY = -Math.sin(pressAngle);
    const vertices = path.vertices;

    canvasContext.fillStyle = color;
    canvasContext.strokeStyle = color;
    canvasContext.lineJoin = "round";
    canvasContext.lineWidth = 2 * scale;

    let press = 0;
    let startRadius = null;
    let currNibAngle = null;
    for (let i = 1; i < vertices.length; i++) {
      const start = vertices[i - 1];
      const end = vertices[i];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const edgeLen = Math.hypot(dx, dy);
      if (edgeLen === 0) {
        yield i / (vertices.length - 1);
        continue;
      }
      const dirX = dx / edgeLen;
      const dirY = dy / edgeLen;

      press +=
        (0.4 + 0.6 * Math.abs(dirX * pressDirX + dirY * pressDirY) - press) *
        0.2;
      const endRadius = maxRadius * press;
      if (startRadius === null) {
        startRadius = endRadius;
      }

      if (currNibAngle === null) {
        currNibAngle = Math.atan2(-dy, dx);
      }
      const startNibDirX = Math.cos(currNibAngle);
      const startNibDirY = -Math.sin(currNibAngle);
      let da = nibAngle - currNibAngle;
      if (da < Math.PI) da += Math.PI * 2;
      if (da > Math.PI) da -= Math.PI * 2;
      currNibAngle += da * 0.2;
      const endNibDirX = Math.cos(currNibAngle);
      const endNibDirY = -Math.sin(currNibAngle);

      canvasContext.beginPath();
      canvasContext.moveTo(
        start.x - startNibDirX * startRadius,
        start.y - startNibDirY * startRadius,
      );
      canvasContext.lineTo(
        start.x + startNibDirX * startRadius,
        start.y + startNibDirY * startRadius,
      );
      canvasContext.lineTo(
        end.x + endNibDirX * endRadius,
        end.y + endNibDirY * endRadius,
      );
      canvasContext.lineTo(
        end.x - endNibDirX * endRadius,
        end.y - endNibDirY * endRadius,
      );
      canvasContext.closePath();
      canvasContext.fill();
      canvasContext.stroke();
      startRadius = endRadius;
      yield i / (vertices.length - 1);
    }
  }
}
