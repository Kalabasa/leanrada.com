import { BasePainter } from "../painter.js";

const dotCount = 250;
const dotSrcPush = 0.2;
const dotRadiusBase = 0.01;
const dotRadiusRange = 0.06;

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

    const midX = (vertices[0].x + vertices.at(-1).x) / 2;
    const midY = (vertices[0].y + vertices.at(-1).y) / 2 + 15 * scale;
    let sourceX = vertices[0].x;
    let sourceY = vertices[0].y;
    let z = 0.15 + this.#random() * 0.4;

    let edgeProgressLen = 0;
    for (let i = 1; i < vertices.length; i++) {
      const start = vertices[i - 1];
      const end = vertices[i];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const edgeLen = Math.hypot(dx, dy);
      while (edgeProgressLen < edgeLen) {
        const progress = edgeProgressLen / edgeLen;
        const x =
          start.x + dx * progress + (this.#random() * 2 - 1) * scale * 0.2;
        const y =
          start.y + dy * progress + (this.#random() * 2 - 1) * scale * 0.2;
        const strokeProgress = (i - 1 + progress) / (vertices.length - 1);
        const midness = 1 - Math.abs(strokeProgress * 2 - 1) ** 2;
        z += (midness * 1.1 - z) * 0.06;
        const st = midness * 0.5;
        sourceX += (midX * st + x * (1 - st) - sourceX) * 0.07;
        sourceY += (midY * st + y * (1 - st) - sourceY) * 0.04;
        this.spray(x, y, z, sourceX, sourceY, 8 * scale, canvasContext);
        edgeProgressLen += stepLen;
      }
      const dripAmount = 1 / z - 2;
      if (this.#random() < dripAmount * 0.06) {
        this.drip(start.x, start.y, dripAmount, scale, canvasContext);
      }
      edgeProgressLen -= edgeLen;
      yield i / (vertices.length - 1);
    }
    canvasContext.restore();
  }

  spray(x, y, z, sourceX, sourceY, radius, canvasContext) {
    const srcDist = Math.hypot(x - sourceX, y - sourceY);
    const srcAngle = Math.atan2(y - sourceY, x - sourceX);
    const alongSrcStretch = 1 + (srcDist / radius) * dotSrcPush;
    const meanDotRadius =
      radius * (dotRadiusBase + (dotRadiusRange * Math.log(3 / 2)) / 3);
    const dotsArea = dotCount * meanDotRadius ** 2;
    const spreadRadius = z * radius;
    const fillArea = spreadRadius ** 2 * alongSrcStretch;
    canvasContext.globalAlpha = Math.min(1, 0.9 * (dotsArea / fillArea));
    canvasContext.beginPath();
    canvasContext.ellipse(
      x,
      y,
      spreadRadius * alongSrcStretch,
      spreadRadius,
      srcAngle,
      0,
      2 * Math.PI,
    );
    canvasContext.fill();

    for (let i = 0; i < dotCount; i++) {
      const a = 2 * Math.PI * this.#random();
      const ru = this.#random();
      const r = z * (0.2 + 0.8 * ru ** 0.25 + ru ** 32);
      const cx = Math.sin(a);
      const cy = Math.cos(a);
      const dotOffset = (spreadRadius * r) / z;
      let dotX = x + cx * dotOffset;
      let dotY = y + cy * dotOffset;

      const fromSrcDist = Math.hypot(dotX - sourceX, dotY - sourceY);
      let fromSrcDirX = 0;
      let fromSrcDirY = 0;
      if (fromSrcDist > 0) {
        fromSrcDirX = (dotX - sourceX) / fromSrcDist;
        fromSrcDirY = (dotY - sourceY) / fromSrcDist;
      }
      const fromSrcProj = cx * fromSrcDirX + cy * fromSrcDirY;
      dotX += fromSrcDirX * fromSrcDist * r * fromSrcProj * dotSrcPush;
      dotY += fromSrcDirY * fromSrcDist * r * fromSrcProj * dotSrcPush;

      const dotR =
        0.01 +
        radius *
          (dotRadiusBase + (dotRadiusRange / (ru + 2)) * this.#random() ** 2);
      canvasContext.globalAlpha = 0.4 + 0.2 / dotR ** 2;
      canvasContext.beginPath();
      canvasContext.arc(dotX, dotY, dotR, 0, 2 * Math.PI);
      canvasContext.fill();
    }
  }

  drip(x, y, dripAmount, scale, canvasContext) {
    const dripWidth = (1.1 + this.#random() * 0.1) * scale;
    const dripLen = dripAmount * (2 + this.#random() * 2) * scale;
    canvasContext.globalAlpha = 0.9;
    canvasContext.strokeStyle = canvasContext.fillStyle;
    canvasContext.lineWidth = dripWidth;
    canvasContext.lineJoin = "round";
    canvasContext.beginPath();
    canvasContext.moveTo(x, y);
    const stepLen = scale;
    let dripX = x;
    for (
      let dripProgressLen = stepLen;
      dripProgressLen < dripLen;
      dripProgressLen += stepLen
    ) {
      dripX += (this.#random() - 0.5) * 0.3 * scale;
      canvasContext.lineTo(dripX, y + dripProgressLen);
    }
    canvasContext.lineTo(dripX, y + dripLen);
    canvasContext.stroke();
    canvasContext.globalAlpha = 1;
    canvasContext.beginPath();
    canvasContext.arc(dripX, y + dripLen, dripWidth * 0.55, 0, 2 * Math.PI);
    canvasContext.fill();
  }
}
