import { createNoise2D } from "./lib/simplex-noise.mjs";

const UPDATE_INTERVAL_MS = 25;
const ANGLE_PER_UPDATE = 0.3;

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
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
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
        const flower = new Flower(ctx, x, y, cellSize / 7);
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
  #noise = null;
  #drawAngle = 0;

  constructor(ctx, x, y, radius) {
    this.#ctx = ctx;
    this.#x = x;
    this.#y = y;
    this.#radius = radius;
  }

  bloom() {
    if (this.#state) return;
    this.#state = "draw";

    this.#petalCount = 5;
    this.#rotation = Math.random() * Math.PI * 2;
    this.#noise = createNoise();
    this.#drawAngle = this.#rotation;
  }

  update() {
    if (this.#state !== "draw") return;

    const endAngle = Math.min(
      this.#drawAngle + ANGLE_PER_UPDATE,
      this.#rotation + Math.PI * 2,
    );

    const radiusAt = (a) => {
      const petal = Math.pow(
        (1 + Math.cos((a - this.#rotation) * this.#petalCount)) / 2,
        0.125,
      );
      return this.#radius * petal + this.#noise(a) * this.#radius * 0.6 * petal;
    };

    const ctx = this.#ctx;
    ctx.beginPath();
    ctx.moveTo(
      this.#x + Math.cos(this.#drawAngle) * radiusAt(this.#drawAngle),
      this.#y + Math.sin(this.#drawAngle) * radiusAt(this.#drawAngle),
    );
    while (this.#drawAngle < endAngle) {
      const stepEnd = Math.min(this.#drawAngle + 0.03, endAngle);
      const r = radiusAt(stepEnd);
      ctx.lineTo(
        this.#x + Math.cos(stepEnd) * r,
        this.#y + Math.sin(stepEnd) * r,
      );
      this.#drawAngle = stepEnd;
    }
    ctx.strokeStyle = "#f00";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.#drawAngle >= this.#rotation + Math.PI * 2) {
      this.#state = "done";
    }
  }
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
