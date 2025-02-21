customElements.define(
  "sprite-sheet-demo",
  class SpriteSheetDemo extends HTMLElement {
    constructor() {
      super();

      const scroll = this.hasAttribute("scroll");
      const alt = this.getAttribute("alt");
      const src = this.getAttribute("src");
      const sheetWidth = this.getAttribute("sheet-width");
      const sheetHeight = this.getAttribute("sheet-height");
      const offsetX = this.getAttribute("offset-x");
      const offsetY = this.getAttribute("offset-y");
      const tileWidth = this.getAttribute("tile-width");
      const tileHeight = this.getAttribute("tile-height");
      const tileFromX = this.getAttribute("tile-from-x");
      const tileFromY = this.getAttribute("tile-from-y");
      const tileToX = this.getAttribute("tile-to-x");
      const tileToY = this.getAttribute("tile-to-y");
      const frames = this.getAttribute("frames");
      const frameDelay = this.getAttribute("frame-delay");
      const scrollIterations = this.getAttribute("scroll-iterations");

      this.dataset.rss = "interactive";
      this.classList.toggle("sprite-sheet-demo-scroll", scroll);
      this.role = "img";
      this.alt = alt;
      this.style.setProperty("--src", `url(${src})`);
      this.style.setProperty("--sheet-width", `${sheetWidth}`);
      this.style.setProperty("--sheet-height", `${sheetHeight}`);
      this.style.setProperty("--offset-x", `${offsetX}`);
      this.style.setProperty("--offset-y", `${offsetY}`);
      this.style.setProperty("--tile-width", `${tileWidth}`);
      this.style.setProperty("--tile-height", `${tileHeight}`);
      this.style.setProperty("--tile-from-x", `${tileFromX}`);
      this.style.setProperty("--tile-from-y", `${tileFromY}`);
      this.style.setProperty("--tile-to-x", `${tileToX}`);
      this.style.setProperty("--tile-to-y", `${tileToY}`);
      this.style.setProperty("--frames", `${frames}`);
      this.style.setProperty("--frame-delay", `${frameDelay ?? 0}`);
      this.style.setProperty("--scroll-iterations", `${scrollIterations ?? 0}`);

      appendStyle(
        this.tagName,
        html`<style>
          sprite-sheet-demo {
            width: var(--tile-width);
            height: var(--tile-height);
            background-image: var(--src);
            background-size: var(--sheet-width) var(--sheet-height);
            background-position-x: calc(
              -1 * var(--tile-width) * var(--tile-from-x) - var(--offset-x, 0px)
            );
            background-position-y: calc(
              -1 * var(--tile-height) * var(--tile-from-y) - var(--offset-y, 0px)
            );
            animation: spriteSheetDemo
              calc(var(--frames, 1) * var(--frame-delay))
              steps(var(--frames), jump-none) infinite;

            @supports (animation-timeline: scroll(block root)) {
              &.sprite-sheet-demo-scroll {
                animation: spriteSheetDemo 1ms steps(var(--frames), jump-none)
                  var(--scroll-iterations);
                animation-timeline: scroll(block root);
              }
            }
          }

          @keyframes spriteSheetDemo {
            from {
              background-position-x: calc(
                -1 * var(--tile-width) * var(--tile-from-x) - var(--offset-x, 0px)
              );
              background-position-y: calc(
                -1 * var(--tile-height) * var(--tile-from-y) - var(--offset-y, 0px)
              );
            }
            to {
              background-position-x: calc(
                -1 * var(--tile-width) * var(--tile-to-x) - var(--offset-x, 0px)
              );
              background-position-y: calc(
                -1 * var(--tile-height) * var(--tile-to-y) - var(--offset-y, 0px)
              );
            }
          }
        </style>`
      );
    }
  }
);
