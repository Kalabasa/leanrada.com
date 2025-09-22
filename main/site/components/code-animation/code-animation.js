(() => {
  const loadPerlinNoise3d = () =>
    import("/lib/vendor/perlin-noise-3d.min.js").then((m) => m.perlinNoise3d);

  const getMousePosition = () =>
    import("/lib/mouse_position.mjs").then((m) => m.mousePosition);

  const alphabet = ".'`\",~:;!i+-^=?/1t7LUC2Vf3S6TYXE0GH4KNPR*MW&8%B@#$";

  customElements.define(
    "code-animation",
    class CodeAnimation extends HTMLElement {
      #canvas = null;
      #context = null;
      #noise = null;

      #gridWidth = 40;
      #gridHeight = 30;
      #palette = ["#ffffff"];

      #cellWidth = 1; // placeholder
      #cellHeight = 1; // placeholder

      #useMouse = false;
      #mouseCell = null;

      #lastT = 0;

      #isVisible = false;

      constructor() {
        super();
      }

      #getT() {
        const t = (Date.now() * 12) / 1000;
        // make it smoother while interacting
        return Math.floor(t);
      }

      /**
       * @param canvas {HTMLCanvasElement}
       * @param context {CanvasRenderingContext2D}
       */
      #draw(canvas, context) {
        const t = this.#getT();
        if (t <= this.#lastT) return;

        const alpha = 1 - Math.pow(1 - 0.9, t - this.#lastT);
        this.#lastT = t;

        const noise = this.#noise;
        const gridWidth = this.#gridWidth;
        const gridHeight = this.#gridHeight;
        const palette = this.#palette;
        const cellWidth = this.#cellWidth;
        const cellHeight = this.#cellHeight;
        const halfGridWidth = gridWidth / 2;
        const halfGridHeight = gridHeight / 2;

        if (!noise) {
          return;
        }

        if (this.#useMouse) {
          getMousePosition().then(({ x, y }) => {
            this.#mouseCell = null;
            const bounds = canvas.getBoundingClientRect();
            if (
              bounds.left < x &&
              x < bounds.right &&
              bounds.top < y &&
              y < bounds.bottom
            ) {
              this.#mouseCell = {
                x: (x - bounds.x) / cellWidth,
                y: (y - bounds.y) / cellHeight,
              };
            }
          });
        }

        const paletteLength = palette.length;
        const xScale = 0.07 + Math.sin(t * 0.03) * 0.06;
        const yScale = 81 + Math.cos(t * 0.05) * 0.06;

        context.globalCompositeOperation = "lighten";
        for (let i = 0; i < gridWidth; i++) {
          for (let j = 0; j < gridHeight; j++) {
            const mouseProximity =
              this.#mouseCell == null
                ? 0
                : 1 -
                  sigmoid(
                    Math.hypot(i - this.#mouseCell.x, j - this.#mouseCell.y) *
                      0.5 -
                      4
                  );

            const xy = [
              1000 +
                (i - halfGridWidth) * xScale +
                Math.sin(t * 0.01) * 2 +
                t * 0.06,
              1000 +
                (j - halfGridHeight) * yScale +
                Math.cos(t * 0.007) * 2 +
                -mouseProximity,
            ];
            const p1 = noise.get(...xy, t * 0.001);
            const p2 = noise.get(...xy, t * 0.001 + 0.5);
            const q =
              noise.get(...xy, t * 0.03 + 1) +
              noise.get(xy[0] * 8, xy[0] * 8, t * 0.03 + 1);
            // for some reason, this library's output range is [0,0.5], so this averages to [0,1]
            const p = p1 + p2;

            const density = Math.max(q, mouseProximity);
            const radius = sigmoid(
              -3 + (8 * Math.hypot(i - gridWidth / 2, j - gridHeight / 2)) /
                Math.hypot(gridWidth / 2, gridHeight / 2)
            );

            const rgb = palette[Math.floor(paletteLength * p)];
            const a = Math.floor(
              alpha * (1 - radius) * (0.1 + density * 0.9) * 255
            )
              .toString(16)
              .padStart(2, "0");

            const charIndex = Math.floor(alphabet.length * density ** 2);
            const char = alphabet[charIndex];

            context.font = `bold ${this.#cellHeight}px 'Space Mono', monospace`;
            context.fillStyle = `${rgb}${a}`;
            context.fillText(char, i * this.#cellWidth, j * this.#cellHeight);
          }
        }

        context.globalCompositeOperation = "darken";
        context.fillStyle = "#33363644";
        context.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
      }

      async #loop() {
        if (!this.#isVisible) {
          return;
        }

        if (!this.#noise) {
          getNoise().then((noise) => {
            this.#noise = noise;
          });
        }

        const canvas = this.#canvas;

        // initialize
        if (!this.#context) {
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
          this.#cellWidth = Math.ceil(canvas.offsetWidth / this.#gridWidth);
          this.#cellHeight = Math.ceil(canvas.offsetHeight / this.#gridHeight);
          canvas.style.filter += ` blur(${
            Math.min(this.#cellWidth, this.#cellHeight) * 0.05
          }px)`;
          this.#context = canvas.getContext("2d");
        }

        this.#draw(canvas, this.#context);

        requestAnimationFrame(() => this.#loop());
      }

      #startLoop() {
        this.#loop();
      }

      connectedCallback() {
        this.#useMouse = this.hasAttribute("mouse");

        const gridWidth = this.getAttribute("width");
        if (gridWidth) {
          this.#gridWidth = Number.parseInt(gridWidth);
        }

        const gridHeight = this.getAttribute("height");
        if (gridHeight) {
          this.#gridHeight = Number.parseInt(gridHeight);
        }

        const paletteAttr = this.getAttribute("palette");
        if (paletteAttr) {
          this.#palette = paletteAttr.split(" ");
          this.#palette.splice(
            Math.floor(this.#palette.length / 2),
            0,
            "#ffffff"
          );
        }

        this.innerHTML = html`
          <canvas style="filter: contrast(1.5)"></canvas>
          <div></div>
        `;

        appendStyle(
          this.tagName,
          html`<style>
            code-animation {
              position: relative;
              background: transparent;

              &::before {
                opacity: 0;
                transition: opacity 2s ease-in;
              }
            }
            code-animation > canvas {
              width: 100%;
              height: 100%;
              opacity: 1;
              animation: nebula-element-fade 2s linear;
            }
            @keyframes nebula-element-fade {
              from {
                opacity: 0;
              }
            }
            code-animation > div {
              position: absolute;
              inset: 0;
              background: url("/components/code-animation/noise.png");
              opacity: 0.2;
              animation: nebula-element-fade 0.5s linear,
                nebula-noise-x 0.16s steps(2, jump-start) infinite,
                nebula-noise-y 0.48s steps(3, jump-start) infinite;
              @supports (mix-blend-mode: overlay) {
                mix-blend-mode: overlay;
                opacity: 0.4;
              }
            }
            @keyframes nebula-noise-x {
              to {
                background-position-x: 100px;
              }
            }
            @keyframes nebula-noise-y {
              to {
                background-position-y: 100px;
              }
            }
            @media (prefers-reduced-motion) {
              code-animation > canvas,
              code-animation > div {
                display: none;
              }
            }
          </style>`
        );

        this.#canvas = this.querySelector("canvas");

        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.target !== this) continue;
            if (this.#isVisible !== entry.isIntersecting) {
              this.#isVisible = entry.isIntersecting;
              if (this.#isVisible) {
                this.#startLoop();
              }
            }
          }
        });
        observer.observe(this);
      }
    }
  );

  let cachedNoisePromise = null;
  function getNoise() {
    if (cachedNoisePromise) return cachedNoisePromise;
    return (cachedNoisePromise = (async () => {
      const perlinNoise3d = await loadPerlinNoise3d();
      const noise = new perlinNoise3d();
      noise.perlin_octaves = 1; // ?? defaults
      noise.perlin_amp_falloff = 1;
      return noise;
    })());
  }

  function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
})();
