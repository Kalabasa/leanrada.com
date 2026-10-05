import { BasePainter } from "../painter.js";

/**
 * @typedef {import("../path.js").Path} Path
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{ lateralOffset: number, inkLoad: number, shortfall: number }} Bristle
 * @typedef {{
 *  x: number,
 *  y: number,
 *  normalX: number,
 *  normalY: number,
 *  pressure: number,
 *  inkTransfer: number,
 * }} BrushSample
 */

const bristleCount = 60;
const paperToothDepth = 0.15;
const samplesPerYield = 3;

/** @type {Bristle[]} */
const bristles = Array.from({ length: bristleCount }, (_, k) => ({
  lateralOffset: (k / (bristleCount - 1)) * 2 - 1,
  inkLoad: 0.2 + 0.4 * hash(k, 0),
  shortfall: 0.4 * hash(k, 1),
}));

/**
 * Hand inputs along the stroke are pressure and velocity.
 * Pressure presses the conical tip into the paper: a bristle touches when
 * the press depth exceeds its distance from the center, and pushes with
 * force proportional to how far it is bent past that point. Hairs are of
 * uneven length, so a short hair is bent less and may not reach at all.
 * Velocity limits how thick an ink film a bristle can leave in passing.
 * A bristle marks the paper where its bend plus its ink film reach deeper
 * than the paper's grain at that spot, and its mark widens as it is pressed
 * flatter and carries more ink.
 */
export class Brush extends BasePainter {
  /**
   * @param {Path} stroke
   * @param {number} scale
   * @param {string} color
   * @param {CanvasRenderingContext2D} canvasContext
   * @yields {void}
   */
  *drawStroke(stroke, scale, color, canvasContext) {
    if (stroke.vertices.length < 2) return;

    const maxRadius = 10 * scale;
    const samples = createBrushSamples(stroke.vertices, maxRadius);
    const paperGrainLen = maxRadius * 0.1;

    canvasContext.strokeStyle = color;
    canvasContext.lineCap = "round";
    const bristleThickness = (maxRadius * 2) / bristleCount;

    let sampleIndex = 0;
    for (const [prev, sample] of slideWindow(samples, 2)) {
      sampleIndex++;

      for (const bristle of bristles) {
        const footprintOffset = bristle.lateralOffset / sample.pressure;
        if (Math.abs(footprintOffset) >= 1) continue;

        const bristleOffset = maxRadius * bristle.lateralOffset;
        const x = sample.x + sample.normalX * bristleOffset;
        const y = sample.y + sample.normalY * bristleOffset;

        const contactForce =
          sample.pressure - Math.abs(bristle.lateralOffset) - bristle.shortfall;
        const inkFilm = bristle.inkLoad * sample.inkTransfer;
        const grainDepth =
          paperToothDepth * sampleNoise2D(x / paperGrainLen, y / paperGrainLen);
        if (contactForce + inkFilm <= grainDepth) continue;

        canvasContext.lineWidth =
          bristleThickness * (1 + contactForce + inkFilm);
        canvasContext.beginPath();
        canvasContext.moveTo(
          prev.x + prev.normalX * bristleOffset,
          prev.y + prev.normalY * bristleOffset,
        );
        canvasContext.lineTo(x, y);
        canvasContext.stroke();
      }
      if (sampleIndex % samplesPerYield === 0) yield;
    }
  }
}

/**
 * The brush is set down already pressed, presses fully while moving off,
 * then lifts while flicking faster into the tail. The hand bears down
 * harder when pulling the brush downward than when pushing it upward.
 * @param {Point[]} vertices
 * @param {number} maxRadius
 * @yields {BrushSample}
 */
function* createBrushSamples(vertices, maxRadius) {
  const strokeLen = measurePathLen(vertices);
  const landingLen = maxRadius * 1.5;
  const liftOffLen = Math.min(maxRadius * 6, strokeLen * 0.5);

  const first = vertices[0];
  const last = vertices.at(-1);
  const paddedPoints = concat(
    [first, first],
    resamplePath(vertices, (maxRadius * 0.1) / samplesPerYield),
    [last, last],
  );
  for (const [before, , point, , after] of slideWindow(paddedPoints, 5)) {
    const tangentX = after.x - before.x;
    const tangentY = after.y - before.y;
    const tangentLen = Math.hypot(tangentX, tangentY) || 1;

    const landingProgress = Math.min(1, point.traveledLen / landingLen);
    const liftOffProgress = Math.min(
      1,
      (strokeLen - point.traveledLen) / liftOffLen,
    );
    const downwardness = (tangentY / tangentLen + 1) / 2;
    const pressure =
      (0.3 + 0.7 * Math.sin((landingProgress * Math.PI) / 2)) *
      liftOffProgress *
      (0.5 + 0.5 * downwardness);
    const velocity = 0.5 + 0.5 * landingProgress + 3 * (1 - liftOffProgress);
    const inkTransfer = Math.min(1, 1.2 / velocity);

    yield {
      x: point.x,
      y: point.y,
      normalX: -tangentY / tangentLen,
      normalY: tangentX / tangentLen,
      pressure,
      inkTransfer,
    };
  }
}

/**
 * @param {Point[]} vertices
 * @returns {number}
 */
function measurePathLen(vertices) {
  let pathLen = 0;
  for (let i = 1; i < vertices.length; i++) {
    const start = vertices[i - 1];
    const end = vertices[i];
    pathLen += Math.hypot(end.x - start.x, end.y - start.y);
  }
  return pathLen;
}

/**
 * @param {Point[]} vertices
 * @param {number} stepLen
 * @yields {{ x: number, y: number, traveledLen: number }}
 */
function* resamplePath(vertices, stepLen) {
  yield { x: vertices[0].x, y: vertices[0].y, traveledLen: 0 };
  let traveledLen = 0;
  let nextSampleLen = stepLen;
  for (let i = 1; i < vertices.length; i++) {
    const start = vertices[i - 1];
    const end = vertices[i];
    const segmentLen = Math.hypot(end.x - start.x, end.y - start.y);
    while (nextSampleLen <= traveledLen + segmentLen) {
      const progress = (nextSampleLen - traveledLen) / segmentLen;
      yield {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
        traveledLen: nextSampleLen,
      };
      nextSampleLen += stepLen;
    }
    traveledLen += segmentLen;
  }
  const last = vertices.at(-1);
  yield { x: last.x, y: last.y, traveledLen };
}

/**
 * @template T
 * @param {...Iterable<T>} iterables
 * @yields {T}
 */
function* concat(...iterables) {
  for (const iterable of iterables) {
    yield* iterable;
  }
}

/**
 * @template T
 * @param {Iterable<T>} items
 * @param {number} size
 * @yields {T[]}
 */
function* slideWindow(items, size) {
  const recentItems = [];
  for (const item of items) {
    recentItems.push(item);
    if (recentItems.length < size) continue;
    yield recentItems.slice();
    recentItems.shift();
  }
}

/**
 * @param {number} x
 * @param {number} y
 * @returns {number} smooth value noise in [0, 1]
 */
function sampleNoise2D(x, y) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const easedX = smoothstep(x - cellX);
  const easedY = smoothstep(y - cellY);
  const top = mix(hash(cellX, cellY), hash(cellX + 1, cellY), easedX);
  const bottom = mix(hash(cellX, cellY + 1), hash(cellX + 1, cellY + 1), easedX);
  return mix(top, bottom, easedY);
}

/**
 * @param {number} progress
 * @returns {number}
 */
function smoothstep(progress) {
  return progress * progress * (3 - 2 * progress);
}

/**
 * @param {number} from
 * @param {number} to
 * @param {number} progress
 * @returns {number}
 */
function mix(from, to, progress) {
  return from + (to - from) * progress;
}

/**
 * @param {number} a
 * @param {number} b
 * @returns {number} in [0, 1)
 */
function hash(a, b) {
  const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return value - Math.floor(value);
}
