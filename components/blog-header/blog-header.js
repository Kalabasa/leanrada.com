(() => {
  customElements.define(
    "blog-header",
    class BlogHeader extends HTMLElement {
      #hero;
      #title;
      #decor;
      #decorPath;

      constructor() {
        super();

        const title = this.querySelector("h1");

        const img = this.querySelector("img");
        const imgWrapper = document.createElement("div");
        img.replaceWith(imgWrapper);
        imgWrapper.appendChild(img);
        imgWrapper.className = "blog-header-hero-box";

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        const path = document.createElementNS(svgNS, "path");
        this.appendChild(svg);
        svg.appendChild(path);

        this.#hero = img;
        this.#title = title;
        this.#decor = svg;
        this.#decorPath = path;

        appendStyle(
          this.tagName,
          html`<style>
            blog-header {
              isolation: isolate;
              margin: 90px 0 24px;
              position: relative;
              left: 50%;
              height: 400px;
              width: min(100%, max(800px, 60vw));
              transform: translateX(-50%);
              box-sizing: border-box;
              animation: none;

              @media (max-width: 600px) {
                margin-top: 48px;
              }

              /* Wrap lines in an angle */
              &::before {
                content: "";
                width: 0;
                width: calc(min(100% - 400px, 120vw - 600px));
                height: 400px;
                float: right;
                shape-outside: polygon(
                  100% 0%,
                  30% 25%,
                  0% 100%,
                  100% 100%,
                  100% 0%
                );
              }

              h1 {
                display: inline;
                position: relative;
                margin: 0;
                top: -0.6em;
                left: -0.7em;
                padding: 0.7em;
                left: -0.35lh;
                padding: 0.35lh;
                max-width: 800px;
                border-radius: 0 18px 18px 0;
                box-decoration-break: clone;
                -webkit-box-decoration-break: clone;
                font-family: var(--display-font);
                font-size: 36px;
                font-weight: bold;
                font-style: italic;
                text-align: left;
                line-height: 2;
                background: var(--bg-clr);
                z-index: 2;
              }

              .blog-header-hero-box {
                position: absolute;
                inset: 0;
                border-radius: 18px;
                background: gray;
                overflow: hidden;
                z-index: -1;
              }

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              svg {
                position: absolute;
                inset: 0;
                pointer-events: none;
                fill: var(--bg-clr);
                z-index: 1;
              }

              @media (max-width: 860px) {
                width: 100vw;
                width: 100svw;
                height: 330px;
                padding-right: 36px;

                .blog-header-hero-box {
                  top: calc(clamp(24px, 20px + 2vw, 36px) * 2);
                }

                h1 {
                  left: 0;
                  font-size: clamp(24px, 20px + 2vw, 36px);
                }
              }

              @media (prefers-reduced-motion) {
                * {
                  animation: none !important;
                }
              }
            }
          </style>`
        );

        this.#updateDecorations();
        const observer = new ResizeObserver(() =>
          // Wait for layout
          requestAnimationFrame(() =>
            requestAnimationFrame(() => this.#updateDecorations())
          )
        );
        observer.observe(this);
      }

      // Add inner corner radius decorations using SVG
      #updateDecorations() {
        const radius = 18;

        const parent = this.getBoundingClientRect();
        const heroRect = this.#hero.getBoundingClientRect();

        const lineBoxHeight = Number.parseInt(
          getComputedStyle(this.#title).lineHeight
        );

        const range = document.createRange();
        range.selectNode(this.#title);
        const rects = [...range.getClientRects()].filter((rect) => {
          // only need line boxes (not individual segments)
          return rect.height >= lineBoxHeight;
        });

        const offsetLeft = -parent.left;
        const offsetTop = -parent.top;
        this.#decor.setAttribute("width", Math.floor(heroRect.width));
        this.#decor.setAttribute("height", Math.floor(heroRect.height));

        const heroAnimationPoints = [];
        const pathCommands = [];
        // Find intersections between title line box rects, find and decorate the corners
        // O(n^2), but n is ~3, so total of ~9 iterations, is fine
        for (let i = 0; i < rects.length; i++) {
          const r1 = rects[i];
          for (let j = i + 1; j < rects.length; j++) {
            const r2 = rects[j];
            if (!rectsIntersect(r1, r2)) continue;

            // Technically there are four potential inner corners
            // But for this specific design, top-left & bottom-left won't be possible

            // Top right corner
            if (r1.top < r2.top - radius && r1.right < r2.right - radius) {
              pathCommands.push(
                drawInnerCorner(
                  offsetLeft + r1.right - 1,
                  offsetTop + r2.top + 1,
                  offsetLeft + Math.min(r1.right + radius, r2.right - radius),
                  offsetTop + Math.max(r2.top - radius, r1.top + radius)
                )
              );
            } else if (
              r1.top > r2.top + radius &&
              r1.right > r2.right + radius
            ) {
              pathCommands.push(
                drawInnerCorner(
                  offsetLeft + r2.right - 1,
                  offsetTop + r1.top + 1,
                  offsetLeft + Math.min(r2.right + radius, r1.right - radius),
                  offsetTop + Math.max(r1.top - radius, r2.top + radius)
                )
              );
            }

            // Bottom right corner
            if (
              r1.bottom > r2.bottom + radius &&
              r1.right < r2.right - radius
            ) {
              heroAnimationPoints.push({
                x: offsetLeft + r1.right - 1,
                y: offsetTop + r2.bottom - 1,
              });
              pathCommands.push(
                drawInnerCorner(
                  offsetLeft + r1.right - 1,
                  offsetTop + r2.bottom - 1,
                  offsetLeft + Math.min(r1.right + radius, r2.right - radius),
                  offsetTop + Math.min(r2.bottom + radius, r1.bottom - radius)
                )
              );
            } else if (
              r1.bottom < r2.bottom - radius &&
              r1.right > r2.right + radius
            ) {
              heroAnimationPoints.push({
                x: offsetLeft + r2.right - 1,
                y: offsetTop + r1.bottom - 1,
              });
              pathCommands.push(
                drawInnerCorner(
                  offsetLeft + r2.right - 1,
                  offsetTop + r1.bottom - 1,
                  offsetLeft + Math.min(r2.right + radius, r1.right - radius),
                  offsetTop + Math.min(r1.bottom + radius, r2.bottom - radius)
                )
              );
            }
          }

          // Special corners for the hero background
          // Top edge
          if (r1.top <= heroRect.top && r1.bottom > heroRect.top) {
            pathCommands.push(
              drawInnerCorner(
                offsetLeft + r1.right - 1,
                offsetTop + heroRect.top - 1,
                offsetLeft + r1.right + radius,
                offsetTop + heroRect.top + radius
              )
            );
          }
          // Left edge
          if (r1.left <= heroRect.left && r1.right > heroRect.left) {
            heroAnimationPoints.push({
              x: offsetLeft + heroRect.left - 1,
              y: offsetTop + r1.bottom - 1,
            });
            pathCommands.push(
              drawInnerCorner(
                offsetLeft + heroRect.left - 1,
                offsetTop + r1.bottom - 1,
                offsetLeft + heroRect.left + radius,
                offsetTop + r1.bottom + radius
              )
            );
          }
        }

        this.#decorPath.setAttribute("d", pathCommands.join(" "));

        if (heroAnimationPoints.length > 0) {
          const point1 = heroAnimationPoints[heroAnimationPoints.length - 1];
          this.style.setProperty(
            "--blog-header-hero-animation-point-1-y",
            point1.y + "px"
          );

          if (heroAnimationPoints.length > 1) {
            const point2 = heroAnimationPoints[heroAnimationPoints.length - 2];
            this.style.setProperty(
              "--blog-header-hero-animation-point-2-y",
              point2.y + "px"
            );
          }
        }
      }
    }
  );

  function rectsIntersect(r1, r2) {
    return (
      r1.right > r2.left &&
      r1.left < r2.right &&
      r1.bottom > r2.top &&
      r1.top < r2.bottom
    );
  }

  function drawInnerCorner(x, y, pointX, pointY) {
    const radiusX = Math.abs(x - pointX);
    const radiusY = Math.abs(y - pointY);
    const dir = (Math.sign((x - pointX) * (y - pointY)) + 1) / 2;
    return (
      `M ${x} ${y} ` +
      `L ${x} ${pointY} ` +
      `A ${radiusX},${radiusY} 0 0 ${dir} ${pointX} ${y} ` +
      `L ${x} ${y}`
    );
  }
})();
