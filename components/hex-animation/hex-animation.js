(() => {
  const loadPerlinNoise3d = () =>
    import("/lib/vendor/perlin-noise-3d.min.js").then((m) => m.perlinNoise3d);

  const getMousePosition = () =>
    import("/lib/mouse_position.mjs").then((m) => m.mousePosition);

  customElements.define(
    "hex-animation",
    class HexAnimation extends HTMLElement {
      #canvas = null;
      #context = null;
      #noise = null;

      #sideLength = 60;
      #palette = ["#ffffff"];

      #useMouse = false;
      #mousePos = null;

      #lastT = 0;

      #isVisible = false;

      constructor() {
        super();
      }

      #getT() {
        const t = (Date.now() * 12) / 1000;
        // make it smoother while interacting
        return this.#mousePos ? t : Math.floor(t);
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
        const sideLength = this.#sideLength;
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

        // Fade out all content gradually
        context.save();
        context.globalCompositeOperation = "source-over";
        const rx = Math.floor(Math.random() * canvas.width);
        const ry = Math.floor(Math.random() * canvas.height);
        const rpixel = context.getImageData(rx, ry, 1, 1);
        const resetRgb =
          Math.floor(0.2 * 140 + 0.8 * rpixel.data[0])
            .toString(16)
            .padStart(2, "0") +
          Math.floor(0.2 * 140 + 0.8 * rpixel.data[1])
            .toString(16)
            .padStart(2, "0") +
          Math.floor(0.2 * 140 + 0.8 * rpixel.data[2])
            .toString(16)
            .padStart(2, "0");
        const resetAlpha = Math.floor(Math.min(alpha * 19, rpixel.data[3]))
          .toString(16)
          .padStart(2, "0");
        context.fillStyle = `#${resetRgb}${resetAlpha}`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();

        const points = [];
        const stepX = Math.sqrt(3) * sideLength;
        const stepY = 1.5 * sideLength;
        const offsetX =
          (canvas.width - Math.floor(canvas.width / stepX) * stepX) / 2;
        const offsetY =
          (canvas.height - Math.floor(canvas.height / stepY) * stepY) / 2;
        for (let row = 0; row < canvas.height / stepY + 2; row++) {
          for (let col = 0; col < canvas.width / stepX + 2; col++) {
            const x = offsetX + col * stepX + (row % 2 ? stepX / 2 : 0);
            const y = offsetY + row * stepY;

            const xy = [
              1000 + x * 0.008 + Math.sin(t * 0.007) * 2,
              1000 + y * 0.008 + Math.cos(t * 0.011) * 2,
            ];
            const p1 = noise.get(...xy, t * 0.0002) * 2;
            const p2 = noise.get(...xy, t * 0.0002 + 0.5) * 2;
            const p3 = noise.get(...xy, t * 0.0002 + 1.0) * 2;
            const q = sigmoid(noise.get(...xy, t * 0.0401) * 15 - 7);

            for (let i = 0; i < 6; i++) {
              const angle = Math.PI / 6 + i * (Math.PI / 3);
              points[i] = {
                x:
                  Math.round(x + sideLength * Math.cos(angle)) +
                  (Math.random() * 0.2 - 0.1) * sideLength,
                y:
                  Math.round(y + sideLength * Math.sin(angle)) +
                  (Math.random() * 0.2 - 0.1) * sideLength,
              };
              if (this.#mousePos) {
                const dx = points[i].x - this.#mousePos.x;
                const dy = points[i].y - this.#mousePos.y;
                const dist = Math.hypot(dx, dy) + 0.01;
                points[i].x += (dx / dist) * 8;
                points[i].y += (dy / dist) * 8;
              }
            }
            for (let i = 0; i < 3; i++) {
              const cur = i * 2;
              const next = (cur + 1) % 6;
              const next2 = (cur + 2) % 6;

              context.beginPath();
              context.moveTo(x, y);
              context.lineTo(points[cur].x, points[cur].y);
              context.lineTo(points[next].x, points[next].y);
              context.lineTo(points[next2].x, points[next2].y);
              context.closePath();

              const rgb1 =
                palette[
                  Math.floor(i + paletteLength * (p1 + p2 + p3)) % paletteLength
                ];
              const rgb2 =
                palette[
                  Math.floor(paletteLength * [p1, p2, p3][i]) % paletteLength
                ];

              const cx =
                (x + points[cur].x + points[next].x + points[next2].x) / 4;
              const cy =
                (y + points[cur].y + points[next].y + points[next2].y) / 4;
              const mouseProximity =
                this.#mousePos == null
                  ? 0
                  : 1 -
                    sigmoid(
                      Math.hypot(cx - this.#mousePos.x, cy - this.#mousePos.y) *
                        (3 / sideLength)
                    );
              const a = Math.floor(Math.max(alpha * q, mouseProximity) * 255)
                .toString(16)
                .padStart(2, "0");

              const gradient = context.createLinearGradient(
                x,
                y,
                points[next].x,
                points[next].y
              );
              gradient.addColorStop(0, `${rgb1}${a}`);
              gradient.addColorStop(1, `${rgb2}${a}`);

              context.fillStyle = gradient;
              context.fill();
            }
          }
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
          this.#context.globalCompositeOperation = "soft-light";
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
            hex-animation {
              position: relative;
            }
            hex-animation > canvas {
              width: 100%;
              height: 100%;
              opacity: 1;
              animation: hex-element-fade 2s linear;
            }
            @keyframes hex-element-fade {
              from {
                opacity: 0;
              }
            }
            hex-animation > div {
              position: absolute;
              inset: 0;
              background: url("/components/hex-animation/noise.png");
              opacity: 0.2;
              animation: hex-element-fade 0.5s linear,
                hex-noise-x 0.18s steps(2, jump-start) infinite,
                hex-noise-y 0.48s steps(3, jump-start) infinite;

              @supports (mix-blend-mode: overlay) {
                mix-blend-mode: overlay;
                opacity: 0.4;
              }
            }
            @keyframes hex-noise-x {
              to {
                background-position-x: 100px;
              }
            }
            @keyframes hex-noise-y {
              to {
                background-position-y: 100px;
              }
            }
            @media (prefers-reduced-motion) {
              hex-animation > canvas,
              hex-animation > div {
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
