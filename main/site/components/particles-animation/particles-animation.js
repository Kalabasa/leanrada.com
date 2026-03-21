(() => {
  const loadP5 = () =>
    import("/lib/vendor/p5.min.js").then(() => window.p5);

  const getMousePosition = () =>
    import("/lib/mouse_position.mjs").then((m) => m.mousePosition);

  const TARGET_FPS = 15;
  const PARTICLE_DENSITY = 0.0013;
  const BILLBOARD_SIZE = 128;
  const BILLBOARD_DENSITY = 0.009;
  const SPEED_ALPHA = 0.8;
  const SPEED_SPAN = 1.6;
  const NOISE_SCALE = 0.004;
  const NOISE_TIME = 0.0001;
  const FORCE_SCALE = 0.4;
  const DAMPING = 0.93;
  const BROWNIAN = 0.01;
  const BILLBOARDS = 4;
  const ALPHA_BUCKETS = 16;
  const PALETTE_TIME = 0.00004;

  class Particle {
    constructor(p5) {
      this.p5 = p5;
      this.init();
    }

    init() {
      this.x = this.p5.random(this.p5.width);
      this.y = this.p5.random(this.p5.height);
      this.vx = 0;
      this.vy = 0;
      this.life = 900;
      this.rotation = Math.random() * 2 * Math.PI;
      this.billboardIndex = Math.floor(this.p5.random(BILLBOARDS));
    }

    step(t, dt, billboardsPool, mousePos = null, mouseVel = null, saturation = 1, goodQuality = true) {
      const p5 = this.p5;
      const speed = Math.hypot(this.vx, this.vy);
      this.life -= dt * (1 + 0.5 / (0.01 + speed));

      if (this.life <= 0 || this.x < 0 || this.y < 0 || this.x > p5.width || this.y > p5.height) {
        return false;
      }

      const nx = this.x * NOISE_SCALE;
      const ny = this.y * NOISE_SCALE;

      let ax = (p5.noise(nx, ny, t * NOISE_TIME) - 0.5) * FORCE_SCALE + BROWNIAN * (p5.random() * 2 - 1);
      let ay = (p5.noise(nx + 2, ny + 2, 2 - t * NOISE_TIME) - 0.5) * FORCE_SCALE + BROWNIAN * (p5.random() * 2 - 1);

      if (mousePos && mouseVel) {
        const mdx = (mousePos.x - this.x) / dt;
        const mdy = (mousePos.y - this.y) / dt;
        const md = mdx * mdx + mdy * mdy;
        const mpf = 0.01 / (1 + md * 0.5);
        const mvf = 0.1 / (1 + md ** 0.5 * 3.0);
        ax += (mousePos.x - this.x) * mpf + mouseVel.x * mvf;
        ay += (mousePos.y - this.y) * mpf + mouseVel.y * mvf;
      }

      this.vx = (this.vx + dt * ax) * Math.pow(DAMPING, dt);
      this.vy = (this.vy + dt * ay) * Math.pow(DAMPING, dt);

      this.x += dt * this.vx;
      this.y += dt * this.vy;

      const alpha = Math.min(1, (speed / SPEED_ALPHA) * (goodQuality ? 1 : 20));
      const idx = Math.round(alpha * (ALPHA_BUCKETS - 1));
      const span = Math.min(
        BILLBOARD_SIZE * Math.max(1 - saturation, Math.min(1, 0.15 + 0.85 * (speed / SPEED_SPAN) ** 2)),
        p5.width * 0.2,
      );

      const x = Math.floor(this.x);
      const y = Math.floor(this.y);
      p5.translate(x, y);
      p5.rotate(this.rotation);
      p5.image(
        billboardsPool[this.billboardIndex][idx],
        -Math.floor(span / 2),
        -Math.floor(span / 2),
        Math.floor(span),
        Math.floor(span),
        Math.floor((BILLBOARD_SIZE - span) / 2),
        Math.floor((BILLBOARD_SIZE - span) / 2),
        Math.floor(span),
        Math.floor(span)
      );
      p5.rotate(-this.rotation);
      p5.translate(-x, -y);
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
      #targetCount = 50;
      #t = 0;
      #quality = 1;

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
              opacity: 0.15;
              animation: 
                particles-noise-x 0.24s steps(2, jump-start) infinite,
                particles-noise-y 0.36s steps(3, jump-start) infinite;

              @supports (mix-blend-mode: soft-light) {
                mix-blend-mode: soft-light;
                opacity: 0.9;
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
        this.#intersectionObserver = new IntersectionObserver(async (entries) => {
          for (const e of entries) {
            if (e.target !== this) continue;
            if (this.#isVisible !== e.isIntersecting) {
              this.#isVisible = e.isIntersecting;
              if (this.#isVisible) {
                await this.#start();
                this.#p5.loop();
              } else {
                this.#p5.noLoop();
              }
            }
          }
        });
        this.#intersectionObserver.observe(this);

        this.#resizeObserver = new ResizeObserver((entries) => {
          if (!this.#p5) return;
          const p5 = this.#p5;
          const { width, height } = entries[0].contentRect;
          p5.resizeCanvas(Math.floor(width), Math.floor(height));
          this.#setupParticles(p5);
        });
        this.#resizeObserver.observe(this);
      }

      disconnectedCallback() {
        this.#intersectionObserver?.disconnect();
        this.#resizeObserver?.disconnect();
        this.#p5?.remove();
      }

      #makeBillboard(p5) {
        const g = p5.createGraphics(BILLBOARD_SIZE, BILLBOARD_SIZE);
        g.clear();
        g.stroke(200, 240, 255);
        g.strokeWeight(1);

        const population = BILLBOARD_DENSITY * (BILLBOARD_SIZE ** 2);
        for (let i = 0; i < population; i++) {
          g.point(BILLBOARD_SIZE * p5.random(), BILLBOARD_SIZE * p5.random());
        }

        return Array.from({ length: ALPHA_BUCKETS }, (_, i) => {
          const a = p5.createGraphics(BILLBOARD_SIZE, BILLBOARD_SIZE);
          a.tint(255, Math.floor((255 * (i + 1)) / ALPHA_BUCKETS));
          a.image(g, 0, 0);
          return a;
        });
      }

      #getTargetParticleCount(p5) {
        const performance = Math.min(1, p5.frameRate() / TARGET_FPS);
        return Math.ceil(1 + PARTICLE_DENSITY * (p5.width * p5.height) * performance ** 0.5);
      }

      #setupParticles(p5) {
        this.#particles = [];
        const n = this.#getTargetParticleCount(p5) * 0.2;
        for (let i = 0; i < n; i++) {
          const pt = new Particle(p5);
          pt.life = i % pt.life;
          this.#particles.push(pt);
        }
      }

      async #start() {
        if (this.#p5) return;
        const P5 = await loadP5();

        const sketch = (p5) => {
          p5.setup = () => {
            p5.frameRate(TARGET_FPS);

            this.#canvas = p5.createCanvas(this.clientWidth, this.clientHeight).elt;
            p5.pixelDensity(Math.min(window.devicePixelRatio, 2));
            p5.noiseDetail(6, 0.5);

            this.#billboardsPool = Array.from({ length: BILLBOARDS }, () => this.#makeBillboard(p5));
            this.#setupParticles(p5);
          };

          p5.draw = () => {
            this.#t += p5.deltaTime;
            const dt = p5.deltaTime * (60 / 1000);

            const performance = p5.frameRate() / TARGET_FPS;
            if (this.#quality > 0 && performance < 0.8) {
              this.#quality -= 0.1;
            } else if (this.#quality <= 1 && performance >= 1) {
              this.#quality += 0.001;
            }
            const goodQuality = this.#quality >= 1;

            const paletteTime = this.#t * PALETTE_TIME;
            const colorHex = this.#palette[Math.floor(paletteTime) % this.#palette.length];
            const backgroundAlpha = Math.round(255 * Math.min(1, 0.05 + 0.05 * (1 + Math.cos((paletteTime + 0.5) * Math.PI * 2))));
            p5.blendMode(p5.BLEND);
            p5.background(colorHex + backgroundAlpha.toString(16).padStart(2, "0"));
            if (goodQuality) p5.blendMode(p5.OVERLAY);
            const overlayAlpha = Math.round(255 * Math.pow(goodQuality ? 0.2 : 0.01, dt));
            p5.background(colorHex + overlayAlpha.toString(16).padStart(2, "0"));
            p5.background(0, 0, 0, overlayAlpha);
            if (goodQuality) p5.blendMode(p5.BLEND);
            const darkenAlpha = Math.round(255 * Math.pow(0.4, dt));
            p5.background(0, 0, 0, darkenAlpha);

            const saturation = this.#particles.length / (PARTICLE_DENSITY * (p5.width * p5.height));
            if (goodQuality) p5.blendMode(p5.ADD);
            this.#particles = this.#particles.filter(
              pt => pt.step(
                this.#t,
                dt,
                this.#billboardsPool,
                this.#mousePos,
                this.#mouseVel,
                saturation,
                goodQuality,
              )
            );

            this.#targetCount += Math.round((this.#getTargetParticleCount(p5) - this.#targetCount) * 0.2);

            for (let i = 0; i < 5; i++) {
              if (this.#particles.length < this.#targetCount) {
                const particle = new Particle(p5);
               if (this.#mousePos && i < 1) {
                  particle.x = this.#mousePos.x;
                  particle.y = this.#mousePos.y;
                }
                this.#particles.push(particle);
              } else {
                break;
              }
            }

            while (this.#particles.length > this.#targetCount * 1.2) {
              this.#particles.pop();
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