import { html } from "../components/html.js";
import { useLayoutEffect, useRef } from "../lib/htm-preact.js";
import { observable, when } from "../lib/mobx.js";
import { observer } from "../util/observer.js";

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

  const area = 500_000;
  const canvasWidth = Math.ceil(Math.sqrt(aspectRatio * area));
  const canvasHeight = Math.ceil(Math.sqrt(area / aspectRatio));

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
        justify-content: center;
        align-items: center;
        overflow: hidden;
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
      .canvasText {
        margin-top: 2vh;
        font-size: 1.5vh;
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
          <h1 class="canvasHeading">Welcome to Guhit Kudlit</h1>
          <h2 class="canvasSubheading">The Baybayin transliterator & calligraphy generator</h2>
          <p class="canvasText">Type your word below!</p>
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
