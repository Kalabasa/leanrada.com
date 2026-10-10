import { html } from "../components/html.js";
import { useLayoutEffect, useRef } from "../lib/htm-preact.js";
import { observable, when } from "../lib/mobx.js";
import { observer } from "../util/observer.js";

const placeholderImageUrl = new URL("./placeholder.png", import.meta.url).href;

export function createCanvas(baybayinUnits) {
  const showPlaceholder = observable.box(true);
  when(
    () => baybayinUnits.get().length > 0,
    () => showPlaceholder.set(false),
  );

  const canvasRef = { current: null };
  const CanvasImpl = observer(() => {
    return html`
      <${Canvas}
        aspectRatio=${1.5}
        canvasRef=${canvasRef}
        showPlaceholder=${showPlaceholder.get()}
      />
    `;
  });
  return { Canvas: CanvasImpl, canvasRef };
}

export function Canvas({ aspectRatio, canvasRef, showPlaceholder }) {
  const containerRef = useRef();

  const canvasWidth =
    Math.min(window.innerWidth, window.innerHeight * aspectRatio) * 0.8;
  const canvasHeight = canvasWidth / aspectRatio;

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(([entry]) => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;
      fitToContainer(
        entry.contentBoxSize[0].inlineSize,
        entry.contentBoxSize[0].blockSize,
        canvasElement,
        aspectRatio,
      );
    });
    const containerElement = containerRef.current;
    resizeObserver.observe(containerElement);
    return () => {
      resizeObserver.unobserve(containerElement);
    };
  }, [containerRef.current, canvasRef.current]);

  return html`
    <style id=${Canvas.name}>
      .canvasContainer {
        width: 100%;
        height: 100%;
        display: grid;
        place-content: center;
      }
      .canvas {
        grid-area: 1 / 1 / -1 / -1;
        background: white;
        box-shadow: var(--shadow-m);
        border-radius: 3px;
        width: 100%;
        height: 100%;
      }
      .canvasPlaceholder {
        grid-area: 1 / 1 / -1 / -1;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
        overflow: hidden;
      }
      .canvasHeader {
        padding: 3vh 0;
        text-align: center;
      }
      .canvasHeading {
        font-size: 5vh;
        letter-spacing: -0.44vh;
      }
      .canvasSubheading {
        font-size: 2vh;
        font-weight: bold;
        text-transform: uppercase;
        opacity: 0.7;
      }
      .canvasImage {
        min-height: 0;
        max-width: 100%;
        object-fit: contain;
        opacity: 0.2;
      }
      .canvasColumns {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--size-l);
        width: 100%;
        contain: inline-size;
        padding: var(--size-l);
        text-align: left;
      }
      .canvasColumnHeading {
        font-size: var(--font-size-l);
        font-weight: bold;
      }
      .canvasText {
        margin-top: var(--size-m);
        font-size: var(--font-size-m);
        em {
          font-style: italic;
        }
      }
    </style>
    <div class="canvasContainer" ref=${containerRef}>
      <canvas
        class="canvas"
        width=${canvasWidth}
        height=${canvasHeight}
        ref=${canvasRef}
      ></canvas>
      ${showPlaceholder &&
      html`
        <div class="canvasPlaceholder">
          <div class="canvasHeader">
            <h1 class="canvasHeading">Maligayang padating sa Guhit Kudlit</h1>
            <h2 class="canvasSubheading">
              Baybayin translator (transliterator) & calligraphy generator
            </h2>
          </div>
          <img class="canvasImage" src=${placeholderImageUrl} alt="" />
          <div class="canvasColumns">
            <div>
              <h3 class="canvasColumnHeading">Transliterate with care</h3>
              <p class="canvasText">
                This app uses predetermined rules of Baybayin. No AI sloppy
                guessing. It also guides you to be better and confident in
                Baybayin. Sa madaling salita, iingatan ka.
              </p>
              <p class="canvasText">Type your word below!</p>
            </div>
            <div>
              <h3 class="canvasColumnHeading">
                Handcrafted calligraphy algorithm
              </h3>
              <p class="canvasText">
                Dynamic calligraphy composition and brush simulation developed
                over the years. Not just a font. Every stroke is unique and
                drawn live in your browser.
              </p>
              <p class="canvasText">Check out the different styles too!</p>
            </div>
            <div>
              <h3 class="canvasColumnHeading">Free for all</h3>
              <p class="canvasText">
                I’m a Filipino software engineer from the Philippines and this
                is my passion project, an intersection of my love for procedural
                art and Baybayin.
              </p>
              <p class="canvasText">
                No need to sign up. Just download and share!
              </p>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
function fitToContainer(containerWidth, containerHeight, element, aspectRatio) {
  const containerAspectRatio = containerWidth / containerHeight;
  if (aspectRatio > containerAspectRatio) {
    element.style.width = containerWidth + "px";
    element.style.height = Math.ceil(containerWidth / aspectRatio) + "px";
  } else {
    element.style.height = containerHeight + "px";
    element.style.width = Math.ceil(containerHeight * aspectRatio) + "px";
  }
}
