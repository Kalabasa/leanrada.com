import { html } from "../components/html.js";
import { useLayoutEffect, useRef } from "../lib/htm-preact.js";

export function createCanvas() {
  const canvasRef = { current: null };
  const CanvasImpl = () =>
    html`<${Canvas} aspectRatio=${1} canvasRef=${canvasRef} />`;
  return { Canvas: CanvasImpl, canvasRef };
}

export function Canvas({ aspectRatio, canvasRef }) {
  const containerRef = useRef();

  const area = 250_000;
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
        aspectRatio
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
        background: white;
        box-shadow: var(--shadow-l);
        border-radius: 3px;
        width: 100%;
        height: 100%;
      }
    </style>
    <div class="canvasContainer" ref=${containerRef}>
      <canvas
        class="canvas"
        width=${canvasWidth}
        height=${canvasHeight}
        ref=${canvasRef}
      ></canvas>
    </div>
  `;
}
function fitToContainer(containerWidth, containerHeight, element, aspectRatio) {
  console.log(containerWidth, containerHeight);
  const containerAspectRatio = containerWidth / containerHeight;
  if (aspectRatio > containerAspectRatio) {
    element.style.width = containerWidth + "px";
    element.style.height = Math.ceil(containerWidth / aspectRatio) + "px";
  } else {
    element.style.height = containerHeight + "px";
    element.style.width = Math.ceil(containerHeight * aspectRatio) + "px";
  }
}
