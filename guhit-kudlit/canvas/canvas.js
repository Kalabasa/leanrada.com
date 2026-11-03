import { html } from "../components/html.js";
import { observer } from "../util/observer.js";
import { formatColorStyleFilter } from "../style/color-styles.js";
import { IntroCanvas } from "./intro.js";
import { CalligraphyStatus } from "../calligraphy/status.js";

export function createCanvas(
  colorStyle,
  showPlaceholder,
  calligraphyStatus,
  onConfig,
) {
  const aspectRatio = Math.min(
    1.5,
    2 * (window.innerWidth / window.innerHeight),
  );

  const canvasRef = { current: null };
  const CanvasImpl = observer(() => {
    return html`
      <${Canvas}
        aspectRatio=${aspectRatio}
        canvasRef=${canvasRef}
        colorStyle=${colorStyle.get()}
        showPlaceholder=${showPlaceholder.get()}
        calligraphyStatus=${calligraphyStatus.get()}
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
  calligraphyStatus,
  onConfig,
}) {
  const canvasWidth =
    Math.min(window.innerWidth, window.innerHeight * aspectRatio) *
    0.8 *
    window.devicePixelRatio;
  const canvasHeight = canvasWidth / aspectRatio;

  return html`
    <style id=${Canvas.name}>
      .canvasContainer {
        width: 100%;
        height: 100%;
        position: relative;
        display: grid;
        place-content: center;
        container-type: size;
      }
      .canvas {
        grid-area: 1 / 1 / -1 / -1;
        background: #fff;
        border-radius: 3px;
        width: min(100cqw, 100cqh * ${aspectRatio});
        height: auto;
        box-shadow: var(--shadow-m);
        view-transition-name: canvas;
      }
      .canvasLoader {
        grid-area: 1 / 1 / -1 / -1;
        place-self: center;
        font-family: "Cubao Narrow", sans-serif;
        font-size: var(--font-size-l);
        background: var(--color-bg-secondary);
        color: var(--color-fg-secondary);
        padding: var(--size-xs);
        rotate: -4deg;
        z-index: 1;
      }
    </style>
    <div class="canvasContainer">
      <canvas
        key="canvas"
        class="canvas"
        style=${{
          filter: formatColorStyleFilter(colorStyle),
        }}
        width=${canvasWidth}
        height=${canvasHeight}
        ref=${canvasRef}
      ></canvas>
      ${calligraphyStatus >= CalligraphyStatus.started &&
      calligraphyStatus < CalligraphyStatus.drawing &&
      html`<span class="canvasLoader">LOADING</span>`}
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
