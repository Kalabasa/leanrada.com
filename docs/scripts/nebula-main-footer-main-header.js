
  (() => {
    customElements.define(
      "nebula-client",
      class Nebula extends BaseElement {
        constructor() {
          super();

          this.asyncCanvas = this.asyncQuerySelector("canvas");
          this.context = null;
          this.noise = null;

          this.gridWidth = 30;
          this.gridHeight = 30;
          this.palette = ["#ffffff"];

          this.cellWidth = 1; // placeholder
          this.cellHeight = 1; // placeholder

          this.useMouse = false;
          this.mouseCell = null;

          this.lastT = 0;
          this.startT = 0;
          this.loopStartT = 0;

          this.isVisible = false;
          this.visibilityListener({
            show: () => {
              this.isVisible = true;
              this.startLoop();
            },
            hide: () => (this.isVisible = false),
          });
        }

        connectedCallback() {
          super.connectedCallback();

          this.useMouse = this.getAttribute("mouse") != null;

          const gridWidth = this.getAttribute("width");
          if (gridWidth) {
            this.gridWidth = Number.parseInt(gridWidth);
          }

          const gridHeight = this.getAttribute("height");
          if (gridHeight) {
            this.gridHeight = Number.parseInt(gridHeight);
          }

          const paletteAttr = this.getAttribute("palette");
          if (paletteAttr) {
            this.palette = paletteAttr.split(" ");
          }
        }

        startLoop() {
          this.loopStartT = this.lastT = this.getT();
          this.loop();
        }

        async loop() {
          if (!this.isVisible) {
            return;
          }

          if (typeof perlinNoise3d === "undefined") {
            setTimeout(() => this.loop(), 200);
            return;
          } else if (!this.noise) {
            this.noise = initNoise();
            this.startT = this.getT();
          }

          const canvas = await this.asyncCanvas.promise;

          // initialize
          if (!this.context) {
            this.cellWidth = Math.ceil(canvas.offsetWidth / this.gridWidth);
            this.cellHeight = Math.ceil(canvas.offsetHeight / this.gridHeight);
            canvas.width = this.gridWidth;
            canvas.height = this.gridHeight;
            canvas.style.filter += ` blur(${
              Math.min(this.cellWidth, this.cellHeight) * 1.25
            }px)`;
            this.context = canvas.getContext("2d");
          }

          this.draw(canvas, this.context);

          requestAnimationFrame(() => this.loop());
        }

        /**
         * @param canvas {HTMLCanvasElement}
         * @param context {CanvasRenderingContext2D}
         */
        draw(canvas, context) {
          const t = this.getT();
          if (t <= this.lastT) return;

          const alpha = 1 - Math.pow(1 - 0.016, t - this.lastT);
          this.lastT = t;

          const {
            noise,
            gridWidth,
            gridHeight,
            palette,
            cellWidth,
            cellHeight,
          } = this;
          const halfGridWidth = gridWidth / 2;
          const halfGridHeight = gridHeight / 2;

          this.mouseCell = null;
          // mousePosition from lib/common
          if (this.useMouse && window.mousePosition) {
            const { x, y } = window.mousePosition;
            const bounds = canvas.getBoundingClientRect();
            if (
              bounds.left < x &&
              x < bounds.right &&
              bounds.top < y &&
              y < bounds.bottom
            ) {
              this.mouseCell = {
                x: (x - bounds.x) / cellWidth,
                y: (y - bounds.y) / cellHeight,
              };
            }
          }

          const paletteLength = palette.length;
          const xScale = 0.14 + Math.sin(t * 0.03) * 0.06;
          const yScale = 0.14 + Math.cos(t * 0.05) * 0.06;

          for (let i = 0; i < gridWidth; i++) {
            for (let j = 0; j < gridHeight; j++) {
              const mouseProximity =
                this.mouseCell == null
                  ? 0
                  : 1 -
                    sigmoid(
                      Math.hypot(i - this.mouseCell.x, j - this.mouseCell.y) - 3
                    );

              const xy = [
                1000 + (i - halfGridWidth) * xScale + Math.sin(t * 0.01) * 2,
                1000 +
                  (j - halfGridHeight) * yScale +
                  Math.cos(t * 0.007) * 2 +
                  -mouseProximity,
              ];
              const p1 = noise.get(...xy, t * 0.03);
              const p2 = noise.get(...xy, t * 0.03 + 0.5);
              // for some reason, this library's output range is [0,0.5], so this averages to [0,1]
              const p = p1 + p2;

              const paletteIndex = Math.floor(paletteLength * p);

              const rgb = palette[paletteIndex];
              const a = Math.floor(Math.max(alpha, mouseProximity) * 255)
                .toString(16)
                .padStart(2, "0");

              context.fillStyle = `${rgb}${a}`;
              context.fillRect(i, j, 1, 1);
            }
          }
        }

        getT() {
          const t = (Date.now() * 30) / 1000;
          // make it smoother while interacting
          return this.mouseCell ? t : Math.floor(t);
        }
      }
    );

    function initNoise() {
      const noise = new perlinNoise3d();
      noise.perlin_octaves = 1; // ?? defaults
      noise.perlin_amp_falloff = 1;
      return noise;
    }

    function sigmoid(x) {
      return 1 / (1 + Math.exp(-x));
    }
  })();


  (() => {
    const topBtn = document.querySelector(".main-footer-top-btn");
    topBtn.addEventListener("click", () => {
      window.scrollTo(0, 0);
    });
  })();


  (() => {
    const mainHeader = document.querySelector(".main-header");
    const indicator = document.querySelector(".main-header-indicator");

    let currentY = 0;
    let currentYTarget = 0;

    let mouseHovering = false;

    let isTouch = false;
    let lastScrollY = window.scrollY;
    let lastCursorY = 0;
    window.addEventListener("scroll", debounce(onScroll));
    window.addEventListener("mousemove", debounce(onMouseMove, 100));
    window.addEventListener("touchstart", onWindowTouchStart);
    window.addEventListener("touchmove", onWindowTouchMove);
    mainHeader.addEventListener("touchstart", onTouchStart);

    function onScroll(event) {
      const dy = window.scrollY - lastScrollY;

      // move with the page
      currentY -= dy;
      if (currentY > 0) {
        currentY = 0;
      } else if (currentY < -mainHeader.offsetHeight) {
        currentY = -mainHeader.offsetHeight;
      }

      currentYTarget = currentY;
      updateDOM();

      lastScrollY = window.scrollY;
    }

    function onMouseMove(event) {
      if (isTouch) return;

      const dy = event.clientY - lastCursorY;

      // show when mouse goes near the top
      const scaledDy = Math.sign(dy) * Math.log1p(Math.abs(dy)) * 20;
      if (dy < 0 && event.clientY + scaledDy < mainHeader.offsetHeight) {
        currentYTarget = 0;
        mouseHovering = true;
      } else if (
        mouseHovering &&
        dy > 0 &&
        event.clientY > mainHeader.offsetHeight * 4
      ) {
        currentYTarget = Math.max(-window.scrollY, -mainHeader.offsetHeight);
        mouseHovering = false;
      }

      updateDOM();
      lastCursorY = event.clientY;
    }

    function onWindowTouchStart(event) {
      isTouch = true;
      lastCursorY = event.touches[0].clientY;
    }
    function onWindowTouchMove(event) {
      const dy = event.touches[0].clientY - lastCursorY;

      // move with touch but only if at edge
      if (window.scrollY <= 0 && dy > 0) {
        currentY += dy;
        if (currentY >= 0) {
          currentY = 0;
          document.body.style.overscrollBehaviorY = null;
        } else if (currentY < 0) {
          document.body.style.overscrollBehaviorY = "none";
        }

        currentYTarget = currentY;
        updateDOM();
      }

      lastCursorY = event.touches[0].clientY;
    }

    function onTouchStart(event) {
      currentYTarget = 0;
      updateDOM();
      console.log("onTouchStart");
    }

    const updateDOM = debounce(() => {
      mainHeader.style.transform = `translateY(${currentY.toFixed(2)}px)`;

      const isHidden = currentY < -mainHeader.offsetHeight * 0.8;
      mainHeader.classList.toggle("hidden", isHidden);

      if (Math.abs(currentY - currentYTarget) > 1) {
        currentY += (currentYTarget - currentY) * 0.2;
        requestAnimationFrame(updateDOM);
      } else {
        currentY = currentYTarget;
      }
    });

    if (mainHeader.classList.contains("prehide")) {
      document.body.style.overscrollBehaviorY = "none";
      currentY = currentYTarget = -mainHeader.offsetHeight;
      updateDOM();
    }

    function debounce(fn, ms = 0) {
      let recentlyFired = false;
      return (...args) => {
        if (recentlyFired) return;
        recentlyFired = true;
        if (ms === 0) {
          requestAnimationFrame(() => (recentlyFired = false));
        } else {
          setTimeout(() => (recentlyFired = false), ms);
        }
        return fn(...args);
      };
    }
  })();
