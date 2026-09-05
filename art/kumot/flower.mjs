import { createNoise2D } from "./lib/simplex-noise.mjs";

const UPDATE_INTERVAL_MS = 25;
const ANGLE_PER_UPDATE = 0.6;

const GREEN = "#3a3";
const DARK_GREEN = "#484";

export function setupFlowers() {
  const container = document.createElement("div");
  container.style.cssText = "position:absolute;inset:0";

  let gridSize = 400;
  let duration = 6000;
  let paramsIntervalMs = 5000;
  let paramsIntervalId = null;
  let flowers = [];
  let grid = new Map();

  function setGridSize(size) {
    gridSize = size;
    grid = new Map();
  }

  function setFlowerDuration(ms) {
    duration = ms;
  }

  function setFlowerInterval(ms) {
    paramsIntervalMs = ms;
    if (paramsIntervalId != null) startFlowerInterval();
  }

  function startFlowerInterval() {
    clearInterval(paramsIntervalId);
    paramsIntervalId = setInterval(() => {
      flowerParams = randomFlowerParams();
    }, paramsIntervalMs);
  }

  function findNearestKey(px, py) {
    const rowHeight = (gridSize * Math.sqrt(3)) / 2;
    const row = Math.round(py / rowHeight - 0.5);
    const col = Math.round((px - ((row % 2) * gridSize) / 2) / gridSize);
    return `${col},${row}`;
  }

  function cellPosition(key) {
    const [col, row] = key.split(",").map(Number);
    const rowHeight = (gridSize * Math.sqrt(3)) / 2;
    return [col * gridSize + ((row % 2) * gridSize) / 2, (row + 0.5) * rowHeight];
  }

  setInterval(() => {
    for (const flower of flowers) {
      flower.update();
    }
  }, UPDATE_INTERVAL_MS);

  /** @type {FlowerParams} */
  let flowerParams = {
    petals: 5,
    sharpness: 0.05,
    layers: 1,
    layerScale: 0.6,
    noisiness: 0.25,
    innerFill: 0.4,
    veinReach: 0.9,
    color: { h: 20, s: 80, l: 50 },
  };

  let lastMoveBloomTime = 0;

  container.addEventListener("pointermove", (event) => {

    const key = findNearestKey(event.clientX, event.clientY);
    if (grid.has(key)) return;

    spawnFlower(key);
    lastMoveBloomTime = Date.now();
  });

  setInterval(() => {
    if (Date.now() - lastMoveBloomTime < 4000) return;

    const x = Math.random() * container.clientWidth;
    const y = Math.random() * container.clientHeight;
    const key = findNearestKey(x, y);
    if (grid.has(key)) return;

    spawnFlower(key);
  }, 200);

  let firstBloom = true;

  function spawnFlower(key) {
    const [cx, cy] = cellPosition(key);
    const flowerRadius = 60;
    const canvas = createCellCanvas(container, cx, cy, flowerRadius * 5);
    const flower = new Flower(
      canvas,
      (flowerRadius * 5) / 2,
      (flowerRadius * 5) / 2,
      60,
      flowerParams,
    );
    flower.bloom();
    flowers.push(flower);
    grid.set(key, flower);

    if (firstBloom) {
      firstBloom = false;
      startFlowerInterval();
    }

    setTimeout(async () => {
      grid.delete(key);
      const idx = flowers.indexOf(flower);
      if (idx >= 0) flowers.splice(idx, 1);
      await clearCanvas(canvas);
      canvas.remove();
    }, duration);
  }

  return {
    container,
    setGridSize,
    setFlowerDuration,
    setFlowerInterval,
  };
}

async function clearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;

  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "rgb(255,255,255)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  const fadeSteps = 45;
  const lighten = Math.ceil(255 / fadeSteps);
  for (let i = 0; i < fadeSteps; i++) {
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgb(${lighten},${lighten},${lighten})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
    await new Promise((r) => setTimeout(r, UPDATE_INTERVAL_MS));
  }
}

function createCellCanvas(parent, centerX, centerY, cellSize) {
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.width = cellSize * dpr;
  canvas.height = cellSize * dpr;
  canvas.style.cssText = `position:absolute;left:${centerX - cellSize / 2}px;top:${centerY - cellSize / 2}px;width:${cellSize}px;height:${cellSize}px;mix-blend-mode: multiply;`;
  parent.append(canvas);
  canvas.getContext("2d").scale(dpr, dpr);
  return canvas;
}

class Flower {
  #canvas;
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
  #leaves = 0;
  #leafDist = 0;

  constructor(
    canvas,
    x,
    y,
    radius,
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
    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d");
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
    this.#stamens = this.#petals * this.#layers;
    this.#leaves = 3 + Math.floor(Math.random() ** 2 * 4);
  }

  bloom() {
    this.#state = "draw";

    this.#rotation = Math.random() * Math.PI * 2;
    this.#faceX = (Math.random() - 0.5) * 1.3;
    this.#faceY = (Math.random() - 0.5) * 1.3;
    this.#noise = createNoise();
    this.#startAngle = Math.atan2(this.#faceY, this.#faceX) + Math.PI;
    this.#drawAngle = this.#startAngle;
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
      const currBg = this.#getPoint(stepEnd, this.#getRadius(stepEnd) + 4);
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
    let outlineColor = `hsl(${h},${s}%,${l}%)`;
    let fillColor = "#fff";
    if (stamenLength < this.#radius * 0.4 && (totalPetals * 111) % 17 < 10) {
      outlineColor = DARK_GREEN;
      fillColor = GREEN;
    }

    const steps = 6;
    const stepLen = stamenLength / steps;
    let px = centerX;
    let py = centerY;

    for (let step = 0; step < steps; step++) {
      const angle = Math.random() * Math.PI * 2;
      const nx =
        px +
        Math.cos(angle) * stepLen * (10 / stamenLength) +
        this.#faceX * stepLen;
      const ny =
        py +
        Math.sin(angle) * stepLen * (10 / stamenLength) +
        this.#faceY * stepLen;

      this.#ctx.strokeStyle = outlineColor;
      this.#ctx.lineWidth = 3;
      this.#ctx.beginPath();
      this.#ctx.moveTo(px, py);
      this.#ctx.lineTo(nx, ny);
      this.#ctx.stroke();

      this.#ctx.strokeStyle = fillColor;
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
    this.#ctx.fillStyle = fillColor;
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
    if (this.#leaves <= 0) {
      this.#state = "done";
      return;
    }

    const angle = this.#startAngle + this.#leaves * 2.4;
    const length = this.#radius * (1.1 + (this.#noise(angle, -1) - 0.5) * 0.4);

    const prevDist = this.#leafDist;
    this.#leafDist = Math.min(this.#leafDist + 6, length);
    const prevT = prevDist / length;
    const t = this.#leafDist / length;

    const width = this.#radius * 0.9 * (1 - this.#sharpness ** 0.25 * 0.9);

    let dirX = Math.cos(angle) - this.#faceX * 1.1;
    let dirY = Math.sin(angle) - this.#faceY * 1.1;
    const rawDirLen = Math.hypot(dirX, dirY);
    dirX /= rawDirLen;
    dirY /= rawDirLen;
    const faceness =
      0.5 *
      (1 +
        (this.#faceX * dirX + this.#faceY * dirY) /
          Math.hypot(this.#faceX, this.#faceY));

    const faceMag = Math.hypot(this.#faceX, this.#faceY);
    const faceDirX = this.#faceX / faceMag;
    const faceDirY = this.#faceY / faceMag;
    const base = [
      this.#x - faceDirX * this.#radius * 0.3,
      this.#y - faceDirY * this.#radius * 0.3,
    ];
    const tip = [this.#x + dirX * length, this.#y + dirY * length];

    const balance = (this.#noise(this.#leaves, 167) - 0.5) * 2 * 0.1;
    const leftControl = [
      this.#x +
        dirX * length * (0.3 + balance) +
        -dirY * width +
        this.#faceX * width * 0.3,
      this.#y +
        dirY * length * (0.3 + balance) +
        dirX * width +
        this.#faceY * width * 0.3,
    ];
    const rightControl = [
      this.#x +
        dirX * length * (0.3 - balance) -
        -dirY * width +
        this.#faceX * width * 0.3,
      this.#y +
        dirY * length * (0.3 - balance) -
        dirX * width +
        this.#faceY * width * 0.3,
    ];

    const getCurvePoint = (control, curveT) => {
      const [px, py] = bezier(base, control, tip, curveT);
      const nv =
        (this.#noise(angle + curveT * Math.PI, -1) - 0.5) *
        length *
        (0.03 + this.#noisiness * 0.04);
      return [px - dirY * nv, py + dirX * nv];
    };

    this.#ctx.globalCompositeOperation = "destination-over";

    this.#ctx.strokeStyle = GREEN;
    this.#ctx.lineWidth = 3;
    this.#ctx.beginPath();
    this.#ctx.moveTo(...getCurvePoint(leftControl, prevT));
    this.#ctx.lineTo(...getCurvePoint(leftControl, t));
    this.#ctx.moveTo(...getCurvePoint(rightControl, prevT));
    this.#ctx.lineTo(...getCurvePoint(rightControl, t));
    this.#ctx.stroke();

    const leafFace = faceDirX * -dirY + faceDirY * dirX;
    const midribPoint = (curveT) => {
      const [lx, ly] = getCurvePoint(leftControl, curveT);
      const [rx, ry] = getCurvePoint(rightControl, curveT);
      const sideDist = Math.hypot(rx - lx, ry - ly);
      const offset = leafFace * sideDist * 0.2;
      return [(lx + rx) / 2 - dirY * offset, (ly + ry) / 2 + dirX * offset];
    };
    this.#ctx.lineWidth = 6 * (1 - t);
    this.#ctx.beginPath();
    this.#ctx.moveTo(...midribPoint(prevT));
    this.#ctx.lineTo(...midribPoint(t));
    this.#ctx.stroke();

    const veinSpacing = 3 + 2 * Math.abs(balance);
    this.#ctx.fillStyle = GREEN;
    for (
      let veinIndex = Math.floor(prevDist / veinSpacing) + 1;
      veinIndex <= Math.floor(this.#leafDist / veinSpacing);
      veinIndex++
    ) {
      const veinT =
        (veinIndex * veinSpacing) / length +
        (this.#noise(veinIndex, this.#leaves) - 0.5) * 0.01;
      const veinReach = Math.min(
        1,
        0.2 + 1.6 * faceness + this.#noise(veinIndex * 10, this.#leaves) * 0.2,
      );
      this.#ctx.beginPath();
      this.#ctx.moveTo(
        ...getCurvePoint(
          leftControl,
          clamp(veinT - (veinReach * 4) / length, 0, 1),
        ),
      );
      this.#ctx.lineTo(
        ...getCurvePoint(leftControl, clamp(veinT + 1 / length, 0, 1)),
      );
      const [baseX, baseY] = getCurvePoint(leftControl, veinT);
      const [otherX, otherY] = getCurvePoint(rightControl, veinT);
      this.#ctx.lineTo(
        lerp(baseX, otherX, veinReach),
        lerp(baseY, otherY, veinReach),
      );
      this.#ctx.closePath();
      this.#ctx.fill();
    }

    this.#ctx.fillStyle = "#fff";
    this.#ctx.beginPath();
    this.#ctx.moveTo(...getCurvePoint(leftControl, prevT));
    this.#ctx.lineTo(...getCurvePoint(leftControl, t));
    this.#ctx.lineTo(...getCurvePoint(rightControl, t));
    this.#ctx.lineTo(...getCurvePoint(rightControl, prevT));
    this.#ctx.closePath();
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

/**
 * @typedef {object} FlowerParams
 * @property {number} petals
 * @property {number} sharpness
 * @property {number} layers
 * @property {number} layerScale
 * @property {number} noisiness
 * @property {number} innerFill
 * @property {number} veinReach
 * @property {{ h: number, s: number, l: number }} color
 */

/** @returns {FlowerParams} */
function randomFlowerParams() {
  const petals = clamp(Math.round(normalRandom(6.5, 3)), 1, 14);
  const petalFraction = (petals - 3) / 10;
  const sharpness =
    clamp(0.1 + petalFraction * 0.1 + Math.random() * 0.45, 0, 1) ** 2;
  const layers = clamp(
    Math.round(1 - petalFraction * 1.5 + Math.random() * 5),
    1,
    6,
  );
  const innerFill = clamp(
    0.1 + layers * 0.1 - sharpness * 0.2 + Math.random() * 0.3,
    0,
    1,
  );
  const layerScale = clamp(
    0.6 - sharpness * 0.2 + layers * 0.02 + Math.random() * 0.35,
    0.45,
    0.9,
  );
  return {
    petals,
    sharpness,
    layers,
    layerScale,
    noisiness: 0.1 + Math.random() * 0.5,
    innerFill,
    veinReach: 0.5 + Math.random() * 0.5,
    color: {
      h: -5 + Math.random() * 35,
      s: 80,
      l: 50,
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
