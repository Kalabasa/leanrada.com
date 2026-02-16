(() => {
  const loadPerlinNoise3d = () =>
    import("/lib/vendor/perlin-noise-3d.min.js").then((m) => m.perlinNoise3d);

  const getMousePosition = () =>
    import("/lib/mouse_position.mjs").then((m) => m.mousePosition);

  customElements.define(
    "pulse-animation",
    class PulseAnimation extends HTMLElement {
      #canvas = null;
      #context = null;
      #noise = null;

      #palette = ["#ffffff"];

      #useMouse = false;
      #mousePos = null;

      #lastT = 0;

      #isVisible = false;

      constructor() {
        super();
      }

      #getT() {
        return Math.round((Date.now() * 12) / 1000);
      }

      /**
       * @param canvas {HTMLCanvasElement}
       * @param context {CanvasRenderingContext2D}
       */
      #draw(canvas, context) {
        const t = this.#getT();
        if (t <= this.#lastT) return;

        const alpha = 1 - Math.pow(1 - 0.8, t - this.#lastT);
        this.#lastT = t;

        const noise = this.#noise;
        const palette = this.#palette;
        const paletteLength = palette.length;

        if (!noise) {
          return;
        }

        if (this.#useMouse) {
          getMousePosition().then(({ x, y }) => {
            this.#mousePos = null;
            const bounds = canvas.getBoundingClientRect();
            if (
              bounds.left < x &&
              x < bounds.right &&
              bounds.top < y &&
              y < bounds.bottom
            ) {
              this.#mousePos = {
                x: x - bounds.x,
                y: y - bounds.y,
              };
            }
          });
        }

        context.save();
        context.globalCompositeOperation = "source-over";
        const a = Math.floor(alpha * (3 * (this.#mousePos ? 1.5 : 1))).toString(16).padStart(2, "0");
        context.fillStyle = `#222222${a}`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();

        const diameter = Math.max(canvas.width, canvas.height);
        for (let r = diameter / 2; r > 0; r -= diameter * 0.06) {
          const rt = r * 0.03 - t * 0.15;
          const p = noise.get(0, rt, t * 0.01) * 2;
          const q = noise.get(2, rt * 2, t * 0.001) * 2;
          const paletteIndex = Math.floor(paletteLength * p);
          const rgb = palette[paletteIndex];
          const a = Math.floor(alpha * q * (32 * (this.#mousePos ? 1.2 : 1)))
            .toString(16)
            .padStart(2, "0");

          const pxn = noise.get(0, 0, t * 0.08) * 2;
          const pyn = noise.get(1, 1, t * 0.08) * 2;
          const pullX = this.#mousePos ? this.#mousePos.x : canvas.width * pxn;
          const pullY = this.#mousePos ? this.#mousePos.y : canvas.height * pyn;
          const pullStr = (0.5 - r / diameter) * (this.#mousePos ? 2 : 0.2);
          const cx = (canvas.width / 2) * (1 - pullStr) + pullX * pullStr;
          const cy = (canvas.height / 2) * (1 - pullStr) + pullY * pullStr;

          context.beginPath();
          context.ellipse(
            cx + (Math.random() * 2 - 1) * r * 0.05,
            cy + (Math.random() * 2 - 1) * r * 0.05,
            r + (Math.random() * 2 - 1) * r * 0.05,
            r + (Math.random() * 2 - 1) * r * 0.05,
            0,
            0,
            2 * Math.PI
          );
          this.#context.globalCompositeOperation = "source-over";
          context.fillStyle = `${rgb}${a}`;
          context.fill();

          context.beginPath();
          context.ellipse(
            cx + (Math.random() * 2 - 1) * r * 0.3,
            cy + (Math.random() * 2 - 1) * r * 0.3,
            r + (Math.random() * 2 - 1) * r * 0.3,
            r + (Math.random() * 2 - 1) * r * 0.3,
            0,
            0,
            2 * Math.PI
          );
          this.#context.globalCompositeOperation = "overlay";
          context.fillStyle = `${rgb}${a}`;
          context.fill();
        }
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

        const paletteAttr = this.getAttribute("palette");
        if (paletteAttr) {
          this.#palette = paletteAttr.split(" ");
        }

        this.innerHTML = html`
          <canvas></canvas>
          <div></div>
        `;

        appendStyle(
          this.tagName,
          html`<style>
            pulse-animation {
              position: relative;
            }
            pulse-animation > canvas {
              width: 100%;
              height: 100%;
              opacity: 1;
              animation: pulse-element-fade 2s linear;
            }
            @keyframes pulse-element-fade {
              from {
                opacity: 0;
              }
            }
            pulse-animation > div {
              position: absolute;
              inset: 0;
              background: url("/components/pulse-animation/noise.png");
              opacity: 0.15;
              animation: pulse-element-fade 0.5s linear,
                pulse-noise-x 0.167s steps(2, jump-start) infinite,
                pulse-noise-y 0.5s steps(3, jump-start) infinite;

              @supports (mix-blend-mode: overlay) {
                mix-blend-mode: overlay;
                opacity: 0.3;
              }
            }
            @keyframes pulse-noise-x {
              to {
                background-position-x: 100px;
              }
            }
            @keyframes pulse-noise-y {
              to {
                background-position-y: 100px;
              }
            }
            @media (prefers-reduced-motion) {
              pulse-animation > canvas,
              pulse-animation > div {
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
})();
