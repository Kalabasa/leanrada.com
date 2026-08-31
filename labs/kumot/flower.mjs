import { createNoise2D } from "./lib/simplex-noise.mjs";

const UPDATE_INTERVAL_MS = 25;
const ANGLE_PER_UPDATE = 0.6;
const CLEAR_MS = 6000;

export function setupFlowers(container) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply";
  container.append(canvas);

  const ctx = canvas.getContext("2d");
  const cellSize = 300;
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
    for (const flower of flowers) {
      flower.clear();
    }
    flowers = [];
    grid = new Map();
  }

  function findNearestKey(px, py) {
    const rowHeight = (cellSize * Math.sqrt(3)) / 2;
    const row = Math.round(py / rowHeight);
    const col = Math.round((px - ((row % 2) * cellSize) / 2) / cellSize);
    return `${col},${row}`;
  }

  function cellPosition(key) {
    const [col, row] = key.split(",").map(Number);
    const rowHeight = (cellSize * Math.sqrt(3)) / 2;
    return [col * cellSize + ((row % 2) * cellSize) / 2, row * rowHeight];
  }

  function tick() {
    for (const flower of flowers) {
      flower.update();
    }
  }

  let flowerParams = randomFlowerParams();
  setInterval(() => {
    flowerParams = randomFlowerParams();
  }, CLEAR_MS * 2);

  resize();
  new ResizeObserver(resize).observe(container);
  setInterval(tick, UPDATE_INTERVAL_MS);

  container.addEventListener("pointermove", (event) => {
    const key = findNearestKey(event.clientX, event.clientY);
    if (grid.has(key)) return;
    const [x, y] = cellPosition(key);
    const flower = new Flower(ctx, x, y, cellSize, flowerParams);
    flower.bloom();
    flowers.push(flower);
    grid.set(key, flower);
    setTimeout(async () => {
      await flower.clear();
      grid.delete(key);
      const idx = flowers.indexOf(flower);
      if (idx >= 0) flowers.splice(idx, 1);
    }, CLEAR_MS);
  });

  return canvas;
}

class Flower {
  #ctx;
  #x;
  #y;
  #cellSize;
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
  #leaves = 0;
  #leafDist = 0;

  constructor(
    ctx,
    x,
    y,
    cellSize,
    {
      petals = 5,
      sharpness = 0.5,
      layers = 4,
      layerScale = 0.65,
      noisiness = 0.5,
      innerFill = 0.5,
      veinReach = 0.5,
      color = { h: 10, s: 90, l: 55 },
    },
  ) {
    this.#ctx = ctx;
    this.#x = x;
    this.#y = y;
    this.#cellSize = cellSize;
    this.#radius = cellSize / 5;
    this.#petals = petals;
    this.#sharpness = sharpness;
    this.#layers = layers;
    this.#layerScale = layerScale;
    this.#noisiness = noisiness;
    this.#innerFill = innerFill;
    this.#veinReach = veinReach;
    this.#color = color;
    this.#stamens = this.#petals * this.#layers;
    this.#leaves = 3;
  }

  bloom() {
    this.#state = "draw";

    this.#rotation = Math.random() * Math.PI * 2;
    this.#faceX = (Math.random() - 0.5) * 1.3;
    this.#faceY = (Math.random() - 0.5) * 1.3;
    this.#noise = createNoise();
    this.#startAngle = Math.atan2(this.#faceY, this.#faceX) + Math.PI;
    this.#drawAngle = this.#startAngle;

    this.#ctx.globalCompositeOperation = "destination-out";
    this.#ctx.beginPath();
    this.#ctx.arc(this.#x, this.#y, this.#cellSize / 2, 0, Math.PI * 2);
    this.#ctx.fill();
    this.#ctx.globalCompositeOperation = "source-over";
  }

  async clear() {
    this.#state = "clear";

    this.#ctx.globalCompositeOperation = "destination-over";
    this.#ctx.fillStyle = `rgba(255,255,255)`;
    this.#ctx.beginPath();
    this.#ctx.arc(this.#x, this.#y, this.#cellSize / 2 + 1, 0, Math.PI * 2);
    this.#ctx.fill();
    this.#ctx.globalCompositeOperation = "source-over";

    const fadeSteps = 45;
    const lighten = Math.ceil(255 / fadeSteps);
    for (let i = 0; i < fadeSteps; i++) {
      this.#ctx.globalCompositeOperation = "lighter";
      this.#ctx.fillStyle = `rgba(${lighten},${lighten},${lighten})`;
      this.#ctx.beginPath();
      this.#ctx.arc(this.#x, this.#y, this.#cellSize / 2 - 1, 0, Math.PI * 2);
      this.#ctx.fill();
      this.#ctx.globalCompositeOperation = "source-over";
      await new Promise((r) => setTimeout(r, UPDATE_INTERVAL_MS));
    }

    this.#ctx.globalCompositeOperation = "destination-out";
    this.#ctx.beginPath();
    this.#ctx.arc(this.#x, this.#y, this.#cellSize / 2, 0, Math.PI * 2);
    this.#ctx.fill();
    this.#ctx.globalCompositeOperation = "source-over";

    this.#state = null;
  }

  update() {
    if (this.#state === "stamen") {
      this.#drawStamen();
      return;
    }
    if (this.#state === "leaf") {
      this.#drawLeaf();
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
    this.#drawVeins(veinStart, 16, this.#veinReach, colorStr);
    this.#drawVeins(veinStart, 12, this.#veinReach * 0.6, darkColorStr);

    if (this.#drawAngle >= this.#startAngle + Math.PI * 2) {
      this.#layer++;
      if (this.#layer >= this.#layers) {
        this.#state = "stamen";
      } else {
        this.#rotation += Math.PI / this.#petals + (Math.random() - 0.5) * 0.2;
        this.#drawAngle = this.#startAngle;
      }
    }
  }

  #layerTransform() {
    const scale = this.#layerScale ** this.#layer;
    return {
      scale,
      offsetX: this.#faceX * this.#radius * (1 - scale) * 0.85,
      offsetY: this.#faceY * this.#radius * (1 - scale) * 0.85,
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
      (1 + (this.#noise(angle, this.#layer) - 0.5) * this.#noisiness)
    );
  }

  #getInner(angle) {
    const petal = this.#getPetal(angle);
    const faceAngle = Math.atan2(-this.#faceY, -this.#faceX);
    const petalAngle =
      this.#rotation +
      (Math.round(((angle - this.#rotation) * this.#petals) / (Math.PI * 2)) *
        (Math.PI * 2)) /
        this.#petals;
    const faceness = (1 + Math.cos(petalAngle - faceAngle)) / 2;
    const innerR =
      this.#radius *
      Math.max(
        0,
        this.#innerFill * 0.7 -
          petal * 0.4 +
          faceness *
            (this.#layer < this.#layers - 1 ? 1 : 0) *
            this.#layers *
            this.#layerScale *
            0.2,
      ) **
        0.5 *
      (1 + (this.#noise(angle, this.#layer) - 0.5) * this.#noisiness);
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
      const randomOffset =
        (this.#noise(a * 7, this.#layer) - 0.5) * 0.15 * this.#radius * scale;
      const dir = len > 0 ? [ox / len, oy / len] : [0, 0];
      const tip = [
        centerX + ox * reach + dir[0] * randomOffset,
        centerY + oy * reach + dir[1] * randomOffset,
      ];
      const control = [
        lerp(center[0], tip[0], 0.5) +
          this.#faceX * this.#radius * scale * 0.8 * reach,
        lerp(center[1], tip[1], 0.5) +
          this.#faceY * this.#radius * scale * 0.8 * reach,
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
    const stamenLength = (this.#radius * 0.2) ** 2 / (1 + totalPetals * 0.4);

    const { offsetX, offsetY } = this.#layerTransform();

    const centerX = this.#x + offsetX;
    const centerY = this.#y + offsetY;
    const { h, s, l } = this.#color;
    const outlineColor = `hsl(${h},${s}%,${l}%)`;

    const steps = 6;
    const stepLen = stamenLength / steps;
    let px = centerX;
    let py = centerY;

    for (let step = 0; step < steps; step++) {
      const angle = Math.random() * Math.PI * 2;
      const nx = px + Math.cos(angle) * stepLen * 0.3 + this.#faceX * stepLen;
      const ny = py + Math.sin(angle) * stepLen * 0.3 + this.#faceY * stepLen;

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
    this.#ctx.arc(
      px + (Math.random() - 0.5) * 4,
      py + (Math.random() - 0.5) * 4,
      1.5,
      0,
      Math.PI * 2,
    );
    this.#ctx.fill();

    this.#stamens--;
    if (this.#stamens <= 0) {
      this.#state = "leaf";
    }
  }

  #drawLeaf() {
    const angle = this.#startAngle + this.#leaves * 2.4;
    const stepLen = 10;
    const length = this.#cellSize / 2;
    this.#leafDist += stepLen;
    const px = this.#x + Math.cos(angle) * this.#leafDist;
    const py = this.#y + Math.sin(angle) * this.#leafDist;
    this.#ctx.globalCompositeOperation = "destination-over";
    this.#ctx.fillStyle = "hsl(120,50%,40%)";
    this.#ctx.beginPath();
    this.#ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    this.#ctx.fill();
    this.#ctx.globalCompositeOperation = "source-over";

    if (this.#leafDist >= length) {
      this.#leafDist = 0;
      this.#leaves--;
      if (this.#leaves <= 0) {
        this.#state = "done";
      }
    }
  }
}

function randomFlowerParams() {
  const petals = clamp(Math.round(normalRandom(6.5, 3)), 2, 13);
  const petalFraction = (petals - 3) / 10;
  const sharpness =
    clamp(0.2 + petalFraction * 0.1 + Math.random() * 0.25, 0, 1) ** 2;
  const layers = clamp(
    Math.round(1 - petalFraction * 1.5 + Math.random() * 4),
    1,
    5,
  );
  const innerFill = clamp(
    0.1 + layers * 0.1 - sharpness * 0.2 + Math.random() * 0.2,
    0,
    1,
  );
  const layerScale = clamp(
    0.65 - sharpness * 0.2 + layers * 0.02 + Math.random() * 0.15,
    0.5,
    0.85,
  );
  return {
    petals,
    sharpness,
    layers,
    layerScale,
    noisiness: 0.2 + Math.random() * 0.3,
    innerFill,
    veinReach: 0.6 + Math.random() * 0.4,
    color: {
      h: -10 + Math.random() * 40,
      s: 95,
      l: 45,
    },
  };
}

function normalRandom(mean, stddev) {
  const u = 1 - Math.random();
  const v = Math.random();
  return (
    mean + stddev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  );
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
  return (angle, layer) => {
    let value = 0;
    let amp = 1;
    let f = freq;
    for (let i = 0; i < octaves; i++) {
      value +=
        noise2d(Math.cos(angle) * f, Math.sin(angle) * f + layer * 100) * amp;
      amp *= 0.5;
      f *= 2;
    }
    return value / maxAmp + 0.5;
  };
}
