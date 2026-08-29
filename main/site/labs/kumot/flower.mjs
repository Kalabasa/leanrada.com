class Flower {
  #ctx;
  #x;
  #y;
  #radius;
  #bloomed = false;

  constructor(ctx, x, y, radius) {
    this.#ctx = ctx;
    this.#x = x;
    this.#y = y;
    this.#radius = radius;
  }

  bloom() {
    this.#bloomed = true;
  }

  update() {
    if (!this.#bloomed) return;
    this.#ctx.beginPath();
    this.#ctx.arc(this.#x, this.#y, this.#radius, 0, Math.PI * 2);
    this.#ctx.fillStyle = "#f00";
    this.#ctx.fill();
  }
}

export function setupFlowers(container) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply";
  container.append(canvas);

  const ctx = canvas.getContext("2d");
  const cellSize = 200;
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
    const rowHeight = cellSize * Math.sqrt(3) / 2;
    const rows = Math.ceil(canvas.height / rowHeight) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellSize + (row % 2) * cellSize / 2;
        const y = row * rowHeight;
        const flower = new Flower(ctx, x, y, cellSize / 3);
        flowers.push(flower);
        grid.set(`${col},${row}`, flower);
      }
    }
  }

  function findNearest(px, py) {
    const rowHeight = cellSize * Math.sqrt(3) / 2;
    const row = Math.round(py / rowHeight);
    const col = Math.round((px - (row % 2) * cellSize / 2) / cellSize);
    return grid.get(`${col},${row}`);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const flower of flowers) {
      flower.update();
    }
  }

  resize();
  new ResizeObserver(resize).observe(container);

  container.addEventListener("pointermove", (event) => {
    const flower = findNearest(event.clientX, event.clientY);
    if (flower) flower.bloom();
    draw();
  });

  return canvas;
}
