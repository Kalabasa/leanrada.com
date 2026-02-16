(() => {
  const loadP5 = () =>
    import("/lib/vendor/p5.min.js").then(() => window.p5);

  const getMousePosition = () =>
    import("/lib/mouse_position.mjs").then((m) => m.mousePosition);

  const PARTICLE_DENSITY = 0.004;
  const BILLBOARD_SIZE = 100;
  const BILLBOARD_DENSITY = 0.008;
  const SPEED_ALPHA = 3;
  const SPEED_SPAN = 6;
  const NOISE_SCALE = 0.004;
  const NOISE_TIME = 0.0001;
  const FORCE_SCALE = 1;
  const DAMPING = 0.94;
  const BROWNIAN = 0.05;
  const BILLBOARDS = 4;
  const ALPHA_BUCKETS = 16;
  const PALETTE_TIME = 0.00004;

  class Particle {
    constructor(p) {
      this.p = p;
      this.init();
    }

    init() {
      this.x = this.p.random(this.p.width);
      this.y = this.p.random(this.p.height);
      this.vx = 0;
      this.vy = 0;
      this.life = 200;
      this.rotation = Math.random() * 2 * Math.PI;
      this.billboardIndex = Math.floor(this.p.random(BILLBOARDS));
    }

    step(t, billboardsPool, mousePos = null, mouseVel = null) {
      const p = this.p;
      const speed = Math.hypot(this.vx, this.vy);
      this.life -= 1 + 0.5 / (0.01 + speed);

      if (this.life <= 0 || this.x < 0 || this.y < 0 || this.x > p.width || this.y > p.height) {
        return false;
      }

      const nx = this.x * NOISE_SCALE;
      const ny = this.y * NOISE_SCALE;

      let ax = (p.noise(nx, ny, t * NOISE_TIME) - 0.5) * FORCE_SCALE;
      let ay = (p.noise(nx + 2, ny + 2, 2 - t * NOISE_TIME) - 0.5) * FORCE_SCALE;

      if (mousePos && mouseVel) {
        const mdx = mousePos.x - this.x;
        const mdy = mousePos.y - this.y;
        const md = mdx * mdx + mdy * mdy;
        const mpf = 1 / (1 + md * 0.5);
        const mvf = 1 / (1 + md ** 0.5 * 1.5);
        ax += (mousePos.x - this.x) * mpf + (mouseVel.x - this.vx) * mvf;
        ay += (mousePos.y - this.y) * mpf + (mouseVel.y - this.vy) * mvf;
      }

      this.vx = (this.vx + ax + BROWNIAN * (p.random() * 2 - 1)) * DAMPING;
      this.vy = (this.vy + ay + BROWNIAN * (p.random() * 2 - 1)) * DAMPING;

      this.x += this.vx;
      this.y += this.vy;

      const alpha = Math.min(1, speed / SPEED_ALPHA);
      const idx = Math.round(alpha * (ALPHA_BUCKETS - 1));
      const span = BILLBOARD_SIZE * Math.min(1, 0.15 + 0.85 * (speed / SPEED_SPAN) ** 2);

      const x = Math.floor(this.x);
      const y = Math.floor(this.y);
      p.translate(x, y);
      p.rotate(this.rotation);
      p.image(
        billboardsPool[this.billboardIndex][idx],
        -Math.floor(span / 2),
        -Math.floor(span / 2),
        span,
        span,
        Math.floor((BILLBOARD_SIZE - span) / 2),
        Math.floor((BILLBOARD_SIZE - span) / 2),
        span,
        span
      );
      p.rotate(-this.rotation);
      p.translate(-x, -y);
      return true;
    }
  }

  customElements.define(
    "particles-animation",
    class ParticlesAnimation extends HTMLElement {
      #p5 = null;
      #canvas = null;
      #isVisible = false;
      #intersectionObserver = null;
      #resizeObserver = null;

      #palette = ["#ffffff"];
      #mousePos = null;
      #mouseVel = null;

      // Sketch state
      #billboardsPool = [];
      #particles = [];
      #t = 0;

      connectedCallback() {
        const paletteAttr = this.getAttribute("palette");
        if (paletteAttr) {
          this.#palette = paletteAttr.split(" ");
        }

        this.innerHTML = `<div></div><div class="particles-noise-overlay"></div>`;
        
        appendStyle(
          this.tagName,
          html`<style>
            particles-animation {
              display: block;
              position: relative;
              overflow: hidden;
            }
            particles-animation canvas {
              width: 100%;
              height: 100%;
              display: block;
              animation: particles-element-fade 2s linear;
            }
            @keyframes particles-element-fade {
              from {
                opacity: 0;
              }
            }
            particles-animation > .particles-noise-overlay {
              position: absolute;
              inset: 0;
              pointer-events: none;
              background: url("/components/particles-animation/noise.png");
              opacity: 0.1;
              animation: 
                particles-noise-x 0.16s steps(2, jump-start) infinite,
                particles-noise-y 0.25s steps(3, jump-start) infinite;

              @supports (mix-blend-mode: soft-light) {
                mix-blend-mode: soft-light;
                opacity: 0.6;
              }
            }
            @keyframes particles-noise-x { to { background-position-x: 100px; } }
            @keyframes particles-noise-y { to { background-position-y: 100px; } }
            @media (prefers-reduced-motion) {
              particles-animation { display: none; }
            }
          </style>`
        );

        this.#setupObservers();
      }

      #setupObservers() {
        this.#intersectionObserver = new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (e.target !== this) continue;
            if (this.#isVisible !== e.isIntersecting) {
              this.#isVisible = e.isIntersecting;
              if (this.#isVisible) this.#start();
            }
          }
        });
        this.#intersectionObserver.observe(this);

        this.#resizeObserver = new ResizeObserver((entries) => {
          if (!this.#p5) return;
          const p = this.#p5;
          const { width, height } = entries[0].contentRect;
          p.resizeCanvas(Math.floor(width), Math.floor(height));
          this.#setupParticles(p);
        });
        this.#resizeObserver.observe(this);
      }

      disconnectedCallback() {
        this.#intersectionObserver?.disconnect();
        this.#resizeObserver?.disconnect();
        this.#p5?.remove();
      }

      #makeBillboard(p) {
        const g = p.createGraphics(BILLBOARD_SIZE, BILLBOARD_SIZE);
        g.clear();
        g.stroke(200, 240, 255);
        g.strokeWeight(1);

        const population = BILLBOARD_DENSITY * (BILLBOARD_SIZE ** 2);
        for (let i = 0; i < population; i++) {
          g.point(BILLBOARD_SIZE * p.random(), BILLBOARD_SIZE * p.random());
        }

        return Array.from({ length: ALPHA_BUCKETS }, (_, i) => {
          const a = p.createGraphics(BILLBOARD_SIZE, BILLBOARD_SIZE);
          a.tint(255, Math.floor((255 * (i + 1)) / ALPHA_BUCKETS));
          a.image(g, 0, 0);
          return a;
        });
      }

      #getTargetCount(p) {
        return PARTICLE_DENSITY * (p.width * p.height);
      }

      #setupParticles(p) {
        this.#particles = [];
        const n = this.#getTargetCount(p);
        for (let i = 0; i < n; i++) {
          const pt = new Particle(p);
          pt.life = i % pt.life;
          this.#particles.push(pt);
        }
      }

      async #start() {
        if (this.#p5) return;
        const P5 = await loadP5();

        const sketch = (p) => {
          p.setup = () => {
            this.#canvas = p.createCanvas(this.clientWidth, this.clientHeight).elt;
            p.pixelDensity(Math.min(window.devicePixelRatio, 2));
            p.noiseDetail(6, 0.5);

            this.#billboardsPool = Array.from({ length: BILLBOARDS }, () => this.#makeBillboard(p));
            this.#setupParticles(p);
          };

          p.draw = () => {
            this.#t += p.deltaTime;

            const paletteTime = this.#t * PALETTE_TIME;
            const colorHex = this.#palette[Math.floor(paletteTime) % this.#palette.length];
            const backgroundAlpha = Math.min(255, 2 + Math.floor(6 * (1 + Math.cos((paletteTime + 0.5) * Math.PI * 2))));
            p.blendMode(p.BLEND);
            p.background(colorHex + backgroundAlpha.toString(16).padStart(2, "0"));
            p.blendMode(p.OVERLAY);
            p.background(colorHex + "08");
            p.background(0, 0, 0, 8);
            p.blendMode(p.BLEND);
            p.background(0, 0, 0, 4);

            p.blendMode(p.ADD);
            this.#particles = this.#particles.filter(
              pt => pt.step(
                this.#t,
                this.#billboardsPool,
                this.#mousePos,
                this.#mouseVel
              )
            );

            const targetCount = this.#getTargetCount(p);

            if (this.#mousePos) {
              while (this.#particles.length < targetCount * 0.95) {
                const particle = new Particle(p);
                particle.x = this.#mousePos.x;
                particle.y = this.#mousePos.y;
                this.#particles.push(particle);
              }
            }

            while (this.#particles.length < targetCount) {
              this.#particles.push(new Particle(p));
            }

            getMousePosition().then(({ x, y }) => {
              const lastMousePos = this.#mousePos;
              this.#mousePos = null;
              const bounds = this.#canvas.getBoundingClientRect();
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
                this.#mouseVel = {
                  x: lastMousePos ? this.#mousePos.x - lastMousePos.x : 0,
                  y: lastMousePos ? this.#mousePos.y - lastMousePos.y : 0
                };
              }
            });
          };
        };

        this.#p5 = new P5(sketch, this.firstElementChild);
      }
    }
  );
})();