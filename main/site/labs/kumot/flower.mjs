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
    const flowerParams = randomFlowerParams();
    const cols = Math.ceil(canvas.width / cellSize) + 1;
    const rowHeight = (cellSize * Math.sqrt(3)) / 2;
    const rows = Math.ceil(canvas.height / rowHeight) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellSize + ((row % 2) * cellSize) / 2;
        const y = row * rowHeight;
        const flower = new Flower(ctx, x, y, cellSize / 6, flowerParams);
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
  #layer = 0;
  #stamens = 0;

  #petals;
  #sharpness;
  #layers;
  #layerScale;
  #noisiness;
  #innerFill;
  #veinReach;
  #color;

  #rotation = 0;
  #faceX = 0;
  #faceY = 0;
  #noise = null;
  #startAngle = 0;
  #drawAngle = 0;

  constructor(ctx, x, y, radius, {
    petals = 5,
    sharpness = 0.5,
    layers = 4,
    layerScale = 0.65,
    noisiness = 0.5,
    innerFill = 0.5,
    veinReach = 0.5,
    color = { h: 10, s: 90, l: 55 },
  }) {
    this.#ctx = ctx;
    this.#x = x;
    this.#y = y;
    this.#radius = radius;
    this.#petals = petals;
    this.#sharpness = sharpness;
    this.#layers = layers;
    this.#layerScale = layerScale;
    this.#noisiness = noisiness;
    this.#innerFill = innerFill;
    this.#veinReach = veinReach;
    this.#color = color;
  }

  bloom() {
    if (this.#state) return;
    this.#state = "draw";

    this.#rotation = Math.random() * Math.PI * 2;
    this.#faceX = (Math.random() - 0.5) * 1.2;
    this.#faceY = (Math.random() - 0.5) * 1.2;
    this.#noise = createNoise();
    this.#startAngle = Math.atan2(this.#faceY, this.#faceX) + Math.PI;
    this.#drawAngle = this.#startAngle;
  }

  update() {
    if (this.#state === "stamen") {
      this.#drawStamen();
      return;
    }
    if (this.#state !== "draw") return;

    const { h, s, l } = this.#color;
    const colorStr = `hsl(${h},${s}%,${l}%)`;
    const darkColorStr = `hsl(${h},${s}%,${l * 0.8}%)`;

    const { offsetX, offsetY } = this.#layerTransform();
    const centerX = this.#x + offsetX;
    const centerY = this.#y + offsetY;

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
      this.#ctx.moveTo(centerX, centerY);
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
      this.#ctx.moveTo(centerX, centerY);
      this.#ctx.lineTo(...prev);
      this.#ctx.lineTo(...curr);
      this.#ctx.closePath();
      this.#ctx.fill();

      this.#ctx.fillStyle = colorStr;
      this.#ctx.beginPath();
      this.#ctx.moveTo(centerX, centerY);
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
    this.#drawVeins(veinStart, 16, this.#veinReach * 1.5, colorStr);
    this.#drawVeins(veinStart, 12, this.#veinReach * 0.6, darkColorStr);

    if (this.#drawAngle >= this.#startAngle + Math.PI * 2) {
      this.#layer++;
      if (this.#layer >= this.#layers) {
        this.#stamens = this.#petals * this.#layers;
        this.#state = "stamen";
      } else {
        this.#rotation += Math.PI / this.#petals;
        this.#drawAngle = this.#startAngle;
      }
    }
  }

  #layerTransform() {
    const scale = this.#layerScale ** this.#layer;
    return {
      scale,
      offsetX: this.#faceX * this.#radius * (1 - scale),
      offsetY: this.#faceY * this.#radius * (1 - scale),
    };
  }

  // base petal lobe shapes
  #getPetal(angle) {
    return (1 + Math.cos((angle - this.#rotation) * this.#petals)) / 2;
  }

  #getRadius(angle) {
    return (
      this.#radius *
      this.#getPetal(angle) ** lerp(0.01, 1, this.#sharpness) *
      (1 + (this.#noise(angle) - 0.5) * this.#noisiness)
    );
  }

  #getInner(angle) {
    const petal = this.#getPetal(angle);
    const faceAngle = Math.atan2(this.#faceY, this.#faceX);
    const petalAngle =
      this.#rotation +
      (Math.round(
        ((angle - this.#rotation) * this.#petals) / (Math.PI * 2),
      ) *
        (Math.PI * 2)) /
        this.#petals;
    const faceness = (1 + Math.cos(petalAngle - faceAngle)) / 2;
    const innerR =
      this.#radius *
      Math.max(0, this.#innerFill * 0.4 - petal * 0.4 + faceness * 0.3) ** 0.5 *
      (1 + (this.#noise(angle) - 0.5) * this.#noisiness);
    return Math.min(this.#getRadius(angle), innerR);
  }

  #getPoint(angle, r) {
    const { scale, offsetX, offsetY } = this.#layerTransform();
    const sr = r * scale;
    return [
      this.#x + offsetX + Math.cos(angle) * sr + this.#faceX * sr,
      this.#y + offsetY + Math.sin(angle) * sr + this.#faceY * sr,
    ];
  }

  #drawVeins(fromAngle, veinsPerPetal, reach, color) {
    const veinStep = (Math.PI * 2) / (this.#petals * veinsPerPetal);
    const segments = 8;
    const { scale, offsetX, offsetY } = this.#layerTransform();
    const centerX = this.#x + offsetX;
    const centerY = this.#y + offsetY;
    const center = [centerX, centerY];
    const halfWidth = 1.5;
    for (let a = fromAngle; a < this.#drawAngle; a += veinStep) {
      if (a + veinStep > this.#drawAngle) break;
      const r = this.#getRadius(a) * scale;
      const ox = Math.cos(a) * r + this.#faceX * r;
      const oy = Math.sin(a) * r + this.#faceY * r;
      const len = Math.sqrt(ox * ox + oy * oy);
      const perpX = -oy / len;
      const perpY = ox / len;
      const randomOffset = (this.#noise(a * 7) - 0.5) * 0.15 * this.#radius * scale;
      const dir = len > 0 ? [ox / len, oy / len] : [0, 0];
      const tip = [
        centerX + ox * reach + dir[0] * randomOffset,
        centerY + oy * reach + dir[1] * randomOffset,
      ];
      const control = [
        lerp(center[0], tip[0], 0.5) + this.#faceX * this.#radius * scale * 0.8 * reach,
        lerp(center[1], tip[1], 0.5) + this.#faceY * this.#radius * scale * 0.8 * reach,
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

  #drawStamen() {
    const totalPetals = this.#petals * this.#layers;
    const stamenLength = this.#radius * 0.3 / (1 + totalPetals * 0.02);

    const { offsetX, offsetY } = this.#layerTransform();

    const centerX = this.#x + offsetX;
    const centerY = this.#y + offsetY;
    const { h, s, l } = this.#color;
    const outlineColor = `hsl(${h},${s}%,${l}%)`;

    const steps = 6;
    const stepLen = stamenLength / steps;
    let px = centerX;
    let py = centerY;
    const faceBias = 0.3;

    for (let step = 0; step < steps; step++) {
      const angle = Math.random() * Math.PI * 2;
      const nx = px + Math.cos(angle) * stepLen + this.#faceX * stepLen * faceBias;
      const ny = py + Math.sin(angle) * stepLen + this.#faceY * stepLen * faceBias;

      this.#ctx.strokeStyle = outlineColor;
      this.#ctx.lineWidth = 3;
      this.#ctx.beginPath();
      this.#ctx.moveTo(px, py);
      this.#ctx.lineTo(nx, ny);
      this.#ctx.stroke();

      this.#ctx.strokeStyle = "#fff";
      this.#ctx.lineWidth = 1.5;
      this.#ctx.beginPath();
      this.#ctx.moveTo(px, py);
      this.#ctx.lineTo(nx, ny);
      this.#ctx.stroke();

      px = nx;
      py = ny;
    }

    this.#ctx.fillStyle = outlineColor;
    this.#ctx.beginPath();
    this.#ctx.arc(px, py, 3, 0, Math.PI * 2);
    this.#ctx.fill();
    this.#ctx.fillStyle = "#fff";
    this.#ctx.beginPath();
    this.#ctx.arc(px + (Math.random() - 0.5) * 3, py + (Math.random() - 0.5) * 3, 1.5, 0, Math.PI * 2);
    this.#ctx.fill();

    this.#stamens--;
    if (this.#stamens <= 0) {
      this.#state = "done";
    }
  }
}

function randomFlowerParams() {
  const petals = clamp(Math.round(normalRandom(5, 2)), 3, 13);
  const petalFraction = (petals - 3) / 10;
  const sharpness = clamp(0.2 + petalFraction * 0.8 + (Math.random() - 0.5) * 0.3, 0, 1);
  const layers = clamp(Math.round(3 - petalFraction * 3 + (Math.random() - 0.5) * 2), 1, 4);
  return {
    petals,
    sharpness,
    layers,
    layerScale: 0.6 + Math.random() * 0.15,
    noisiness: 0.2 + Math.random() * 0.4,
    innerFill: 0.2 + Math.random() * 0.6,
    veinReach: 0.2 + Math.random() * 0.4,
    color: {
      h: 0 + Math.random() * 20,
      s: 95,
      l: 45,
    },
  };
}

function normalRandom(mean, stddev) {
  const u = 1 - Math.random();
  const v = Math.random();
  return mean + stddev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
