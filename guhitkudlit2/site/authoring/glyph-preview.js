import { planStrokes } from "../calligraphy/plan-strokes.js";
import { html } from "../components/html.js";
import { useEffect, useRef } from "../lib/htm-preact.js";
import { computed } from "../lib/mobx.js";
import { debounce } from "../util/debounce.js";
import { observer } from "../util/observer.js";

export function createGlyphPreview({ appState }) {
  const strokes = computed(() => {
    if (!appState.previewEnabled) return [];
    if (!appState.selectedGlyph) return [];
    const strokes = planStrokes(
      appState.selectedGlyph.nodes,
      appState.selectedGlyph.edges
    );
    return [...strokes];
  });

  return observer(
    ({ width, height }) =>
      html`<${GlyphPreview}
        width=${width}
        height=${height}
        strokes=${strokes.get()}
      />`
  );
}

const GlyphPreview = ({ width, height, strokes }) => {
  const canvasRef = useRef();

  useEffect(() => {
    if (!canvasRef.current) return;
    drawStrokes(canvasRef.current, strokes);
  }, [canvasRef.current, width, height, strokes]);

  return html`<canvas ref=${canvasRef} width=${width} height=${height} />`;
};

const drawStrokes = debounce((canvas, strokes) => {
  /** @type {CanvasRenderingContext2D} */
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.beginPath();
  strokes.forEach((stroke) => {
    context.moveTo(stroke.start.x, stroke.start.y);
    context.lineTo(stroke.end.x, stroke.end.y);
  });
  context.lineWidth = 20;
  context.strokeStyle = "#cff";
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();
}, 100);
