(() => {
  let planeImage = null;
  const loadPlaneImage = async () => {
    if (planeImage) return planeImage;

    const image = new Image();
    image.src = "/components/map-flight/plane.png";
    planeImage = image;

    return new Promise((resolve) => {
      image.onload = () => {
        resolve(image);
      };
    });
  };

  customElements.define(
    "map-flight",
    class MapFlight extends HTMLElement {
      /***
       * @type {Array<{
       *  x: number,
       *  y: number,
       *  target: { x: number, y: number },
       * }>}
       */
      #flights = [];
      #destination = null;
      /***
       * @type {CanvasRenderingContext2D}
       */
      #canvasContext = null;
      #visible = false;

      constructor() {
        super();

        const isOrigin = this.hasAttribute("origin");

        this.innerHTML = html`<div>
          <img alt="map" src="${this.getAttribute("bgsrc")}" loading="lazy" />
          <canvas></canvas>
        </div>`;

        appendStyle(
          this.tagName,
          html`<style>
            map-flight {
              overflow: hidden;
            }
            map-flight div {
              position: relative;
              width: 100%;
              height: 100%;
            }
            map-flight img {
              display: block;
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            map-flight canvas {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
            }
          </style>`
        );

        this.#canvasContext = this.querySelector("canvas").getContext("2d");
        this.#destination = document.querySelector("map-flight[destination]");

        let launchTimer = null;
        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.target !== this) continue;
            if (this.#visible !== entry.isIntersecting) {
              this.#visible = entry.isIntersecting;
              if (this.#visible) {
                const rect = this.getBoundingClientRect();
                this.#canvasContext.canvas.width = rect.width;
                this.#canvasContext.canvas.height = rect.height;

                if (isOrigin && this.#destination && launchTimer === null) {
                  this.#launchAFlight();
                  launchTimer = setTimeout(this.#launchAFlight, 30e3);
                }

                this.#animate();
              } else {
                this.#flights.length = 0;

                if (launchTimer !== null) {
                  clearTimeout(launchTimer);
                  launchTimer = null;
                }
              }
            }
          }
        });
        observer.observe(this);
      }

      #animate = () => {
        if (!this.#visible) return;

        const context = this.#canvasContext;
        const width = context.canvas.width;
        const height = context.canvas.height;
        context.clearRect(0, 0, width, height);

        context.save();
        context.translate(width / 2, height / 2);
        context.imageSmoothingEnabled = false;
        const trailDurationMs = 8e3;

        const now = Date.now();

        for (let i = this.#flights.length - 1; i >= 0; i--) {
          const flight = this.#flights[i];
          if (now - trailDurationMs >= flight.target.t) {
            this.#flights.splice(i, 1);
            continue;
          }

          const t = Math.max(
            0,
            Math.min(
              1,
              (now - flight.origin.t) / (flight.target.t - flight.origin.t)
            )
          );
          const x = lerp(flight.origin.x, flight.target.x, t);
          const y = lerp(flight.origin.y, flight.target.y, t);
          const angle = Math.atan2(
            flight.target.x - flight.origin.x,
            flight.origin.y - flight.target.y
          );

          const size = Math.max(
            0,
            Math.min(
              8,
              (flight.target.t - now) * 0.01,
              (now - flight.origin.t) * 0.01
            )
          );

          if (now < flight.target.t) {
            context.save();
            context.translate(x, y);
            context.rotate(angle);
            if (angle > 0 && angle < Math.PI) {
              context.scale(-1, 1);
            }
            context.drawImage(planeImage, -size, -size, size * 2, size * 2);
            context.restore();
          }

          const trailThickness = Math.max(
            0,
            Math.min(
              2,
              (flight.target.t - now + trailDurationMs) * 0.002,
              (now - flight.origin.t) * 0.002
            )
          );

          const trailT = Math.max(
            0,
            Math.min(
              1,
              (now - trailDurationMs - flight.origin.t) /
                (flight.target.t - flight.origin.t)
            )
          );
          const trailX = lerp(flight.origin.x, flight.target.x, trailT);
          const trailY = lerp(flight.origin.y, flight.target.y, trailT);
          const trailStartX = x - Math.sin(angle) * (size + 6);
          const trailStartY = y + Math.cos(angle) * (size + 6);
          context.beginPath();
          context.moveTo(
            trailStartX + Math.cos(angle) * trailThickness,
            trailStartY + Math.sin(angle) * trailThickness
          );
          context.lineTo(
            trailStartX - Math.cos(angle) * trailThickness,
            trailStartY - Math.sin(angle) * trailThickness
          );
          context.lineTo(trailX, trailY);
          context.closePath();

          context.fillStyle = "#fff";
          context.fill();
        }

        context.restore();

        // quarter the frame rate for performance
        const rAF = requestAnimationFrame;
        rAF(() => rAF(() => rAF(() => rAF(this.#animate))));
      };

      #launchAFlight = async () => {
        await loadPlaneImage();

        const originRect = this.getBoundingClientRect();
        const destRect = this.#destination.getBoundingClientRect();
        const deltaX =
          destRect.x - originRect.x + (destRect.width - originRect.width) / 2;
        const deltaY =
          destRect.y - originRect.y + (destRect.height - originRect.height) / 2;
        const distance = Math.hypot(deltaX, deltaY);
        const durationMs = distance * 40.0;
        const gap = 1000;

        const now = Date.now();
        this.#flights.push({
          origin: {
            x: 0,
            y: 0,
            t: now,
          },
          target: {
            x: deltaX,
            y: deltaY,
            t: now + durationMs,
          },
        });

        this.#destination.#flights.push({
          origin: {
            x: -deltaX,
            y: -deltaY,
            t: now + gap,
          },
          target: {
            x: 0,
            y: 0,
            t: now + durationMs + gap,
          },
        });
      };
    }
  );

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
})();
