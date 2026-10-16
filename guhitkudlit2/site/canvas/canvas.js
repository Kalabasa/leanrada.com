import { html } from "../components/html.js";
import { useLayoutEffect, useRef } from "../lib/htm-preact.js";
import { classes } from "../util/classes.js";
import { observer } from "../util/observer.js";
import { formatColorStyleFilter } from "../style/color-styles.js";
import { IntroCanvas } from "./intro.js";

export function createCanvas(colorStyle, showPlaceholder, onConfig) {
  const aspectRatio = Math.min(
    1.5,
    2 * (window.innerWidth / window.innerHeight),
  );
  console.log(aspectRatio);

  const canvasRef = { current: null };
  const CanvasImpl = observer(() => {
    return html`
      <${Canvas}
        aspectRatio=${aspectRatio}
        canvasRef=${canvasRef}
        colorStyle=${colorStyle.get()}
        showPlaceholder=${showPlaceholder.get()}
        onConfig=${onConfig}
      />
    `;
  });
  return { Canvas: CanvasImpl, canvasRef };
}

export function Canvas({
  aspectRatio,
  canvasRef,
  colorStyle,
  showPlaceholder,
  onConfig,
}) {
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
        position: relative;
        display: grid;
        place-content: center;
      }
      .canvas {
        grid-area: 1 / 1 / -1 / -1;
        background: #fff;
        border-radius: 3px;
        width: 100%;
        height: 100%;
        view-transition-name: canvas;
      }
    </style>
    <div class="canvasContainer" ref=${containerRef}>
      <canvas
        class="canvas"
        style=${{
          filter: `${formatColorStyleFilter(colorStyle)} drop-shadow(0 0 6px var(--color-shadow))`,
        }}
        width=${canvasWidth}
        height=${canvasHeight}
        ref=${canvasRef}
      ></canvas>
      ${showPlaceholder &&
      html`
        <${IntroCanvas}
          canvasWidth=${canvasWidth}
          canvasHeight=${canvasHeight}
          onConfig=${onConfig}
        />
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
