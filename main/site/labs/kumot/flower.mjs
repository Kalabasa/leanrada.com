import { createNoise2D } from "./lib/simplex-noise.mjs";

const UPDATE_INTERVAL_MS = 25;
const ANGLE_PER_UPDATE = 0.3;

export function setupFlowers(container) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply";
  container.append(canvas);

  const ctx = canvas.getContext("2d");
  const cellSize = 400;
  let flowers = [];
  let grid = new Map();

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + "px";
    canvas.style.height = container.clientHeight + "px";
    ctx.scale(dpr, dpr);
    buildGrid();
  }

  function buildGrid() {
    flowers = [];
    grid = new Map();
    const cols = Math.ceil(canvas.width / cellSize) + 1;
    const rowHeight = (cellSize * Math.sqrt(3)) / 2;
    const rows = Math.ceil(canvas.height / rowHeight) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellSize + ((row % 2) * cellSize) / 2;
        const y = row * rowHeight;
        const flower = new Flower(ctx, x, y, cellSize / 6, {
          r: 240,
          g: 60,
          b: 0,
        });
        flowers.push(flower);
        grid.set(`${col},${row}`, flower);
      }
    }
  }

  function findNearest(px, py) {
    const rowHeight = (cellSize * Math.sqrt(3)) / 2;
    const row = Math.round(py / rowHeight);
    const col = Math.round((px - ((row % 2) * cellSize) / 2) / cellSize);
    return grid.get(`${col},${row}`);
  }

  function tick() {
    for (const flower of flowers) {
      flower.update();
    }
  }

  resize();
  new ResizeObserver(resize).observe(container);
  setInterval(tick, UPDATE_INTERVAL_MS);

  container.addEventListener("pointermove", (event) => {
    const flower = findNearest(event.clientX, event.clientY);
    if (flower) flower.bloom();
  });

  return canvas;
}

class Flower {
  #ctx;
  #x;
  #y;
  #radius;
  #state = null;

  #petalCount = 0;
  #rotation = 0;
  #faceX = 0;
  #faceY = 0;
  #noise = null;
  #startAngle = 0;
  #drawAngle = 0;
  #color;

  constructor(ctx, x, y, radius, color) {
    this.#ctx = ctx;
    this.#x = x;
    this.#y = y;
    this.#radius = radius;
    this.#color = color;
  }

  bloom() {
    if (this.#state) return;
    this.#state = "draw";

    this.#petalCount = 5;
    this.#rotation = Math.random() * Math.PI * 2;
    this.#faceX = (Math.random() - 0.5) * 1.2;
    this.#faceY = (Math.random() - 0.5) * 1.2;
    this.#noise = createNoise();
    this.#startAngle = Math.atan2(this.#faceY, this.#faceX) + Math.PI;
    this.#drawAngle = this.#startAngle;
  }

  update() {
    if (this.#state !== "draw") return;

    const { r, g, b } = this.#color;
    const colorStr = `rgb(${r},${g},${b})`;
    const darkColorStr = `rgb(${Math.floor(r * 0.8)},${Math.floor(g * 0.8)},${Math.floor(b * 0.8)})`;

    const endAngle = Math.min(
      this.#drawAngle + ANGLE_PER_UPDATE,
      this.#startAngle + Math.PI * 2,
    );

    const aheadEnd = Math.min(
      endAngle + ANGLE_PER_UPDATE,
      this.#startAngle + Math.PI * 2,
    );
    let aheadAngle = endAngle;
    let prevBg = this.#getPoint(aheadAngle, this.#getRadius(aheadAngle) + 2);
    while (aheadAngle < aheadEnd) {
      const stepEnd = Math.min(aheadAngle + 0.03, aheadEnd);
      const currBg = this.#getPoint(stepEnd, this.#getRadius(stepEnd) + 2);
      this.#ctx.fillStyle = "#fff";
      this.#ctx.beginPath();
      this.#ctx.moveTo(this.#x, this.#y);
      this.#ctx.lineTo(...prevBg);
      this.#ctx.lineTo(...currBg);
      this.#ctx.closePath();
      this.#ctx.fill();
      prevBg = currBg;
      aheadAngle = stepEnd;
    }

    let prev = this.#getPoint(
      this.#drawAngle,
      this.#getRadius(this.#drawAngle),
    );
    let prevInner = this.#getPoint(
      this.#drawAngle,
      this.#getInner(this.#drawAngle),
    );
    while (this.#drawAngle < endAngle) {
      const stepEnd = Math.min(this.#drawAngle + 0.03, endAngle);
      const curr = this.#getPoint(stepEnd, this.#getRadius(stepEnd));
      const currInner = this.#getPoint(stepEnd, this.#getInner(stepEnd));

      this.#ctx.fillStyle = "#fff";
      this.#ctx.beginPath();
      this.#ctx.moveTo(this.#x, this.#y);
      this.#ctx.lineTo(...prev);
      this.#ctx.lineTo(...curr);
      this.#ctx.closePath();
      this.#ctx.fill();

      this.#ctx.fillStyle = colorStr;
      this.#ctx.beginPath();
      this.#ctx.moveTo(this.#x, this.#y);
      this.#ctx.lineTo(...prevInner);
      this.#ctx.lineTo(...currInner);
      this.#ctx.closePath();
      this.#ctx.fill();

      this.#ctx.beginPath();
      this.#ctx.moveTo(...prev);
      this.#ctx.lineTo(...curr);
      this.#ctx.strokeStyle = colorStr;
      this.#ctx.lineWidth = 2;
      this.#ctx.stroke();

      prev = curr;
      prevInner = currInner;
      this.#drawAngle = stepEnd;
    }

    const veinStart = endAngle - ANGLE_PER_UPDATE;
    this.#drawVeins(veinStart, 16, 0.75, colorStr);
    this.#drawVeins(veinStart, 12, 0.3, darkColorStr);

    if (this.#drawAngle >= this.#startAngle + Math.PI * 2) {
      this.#state = "done";
    }
  }

  // base petal lobe shapes
  #getPetal(angle) {
    return (1 + Math.cos((angle - this.#rotation) * this.#petalCount)) / 2;
  }

  #getRadius(angle) {
    return (
      this.#radius *
      this.#getPetal(angle) ** 0.05 *
      (0.8 + this.#noise(angle) * 0.4)
    );
  }

  #getInner(angle) {
    const petal = this.#getPetal(angle);
    const faceAngle = Math.atan2(this.#faceY, this.#faceX);
    const petalAngle =
      this.#rotation +
      (Math.round(
        ((angle - this.#rotation) * this.#petalCount) / (Math.PI * 2),
      ) *
        (Math.PI * 2)) /
        this.#petalCount;
    const faceness = (1 + Math.cos(petalAngle - faceAngle)) / 2;
    const innerR =
      this.#radius *
      Math.max(0, 0.2 - petal * 0.4 + faceness * 0.3) ** 0.5 *
      (0.6 + this.#noise(angle) * 0.8);
    return Math.min(this.#getRadius(angle), innerR);
  }

  #getPoint(angle, r) {
    return [
      this.#x + Math.cos(angle) * r + this.#faceX * r,
      this.#y + Math.sin(angle) * r + this.#faceY * r,
    ];
  }

  #drawVeins(fromAngle, veinsPerPetal, reach, color) {
    const veinStep = (Math.PI * 2) / (this.#petalCount * veinsPerPetal);
    const segments = 8;
    const center = [this.#x, this.#y];
    const halfWidth = 1.5;
    for (let a = fromAngle; a < this.#drawAngle; a += veinStep) {
      if (a + veinStep > this.#drawAngle) break;
      const r = this.#getRadius(a);
      const ox = Math.cos(a) * r + this.#faceX * r;
      const oy = Math.sin(a) * r + this.#faceY * r;
      const len = Math.sqrt(ox * ox + oy * oy);
      const perpX = -oy / len;
      const perpY = ox / len;
      const randomOffset = (this.#noise(a * 7) - 0.5) * 0.15 * this.#radius;
      const dir = len > 0 ? [ox / len, oy / len] : [0, 0];
      const tip = [
        this.#x + ox * reach + dir[0] * randomOffset,
        this.#y + oy * reach + dir[1] * randomOffset,
      ];
      const control = [
        lerp(center[0], tip[0], 0.5) + this.#faceX * this.#radius * 0.8 * reach,
        lerp(center[1], tip[1], 0.5) + this.#faceY * this.#radius * 0.8 * reach,
      ];
      const points = [];
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const [px, py] = bezier(center, control, tip, t);
        points.push({ px, py, w: lerp(halfWidth, 0.5, t) });
      }
      this.#ctx.fillStyle = color;
      this.#ctx.beginPath();
      for (let s = 0; s <= segments; s++) {
        const { px, py, w } = points[s];
        if (s === 0) this.#ctx.moveTo(px + perpX * w, py + perpY * w);
        else this.#ctx.lineTo(px + perpX * w, py + perpY * w);
      }
      for (let s = segments; s >= 0; s--) {
        const { px, py, w } = points[s];
        this.#ctx.lineTo(px - perpX * w, py - perpY * w);
      }
      this.#ctx.closePath();
      this.#ctx.fill();
    }
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function bezier(p0, p1, p2, t) {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

function createNoise(freq = 0.5, octaves = 8) {
  const noise2d = createNoise2D();
  const maxAmp = 2 * (1 - Math.pow(0.5, octaves));
  return (angle) => {
    let value = 0;
    let amp = 1;
    let f = freq;
    for (let i = 0; i < octaves; i++) {
      value += noise2d(Math.cos(angle) * f, Math.sin(angle) * f) * amp;
      amp *= 0.5;
      f *= 2;
    }
    return value / maxAmp + 0.5;
  };
}
