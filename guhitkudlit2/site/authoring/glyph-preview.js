import { generatePath } from "../calligraphy/generate-path.js";
import { BasePainter } from "../calligraphy/painter.js";
import { html } from "../components/html.js";
import { useEffect, useRef } from "../lib/htm-preact.js";
import { computed } from "../lib/mobx.js";
import { debounce } from "../util/debounce.js";
import { observer } from "../util/observer.js";

const annotatePath = new URL(location).searchParams.has("annotatePath");

export function createGlyphPreview({ appState }) {
  const painter = new BasePainter();

  const strokes = computed(() => {
    if (!appState.previewEnabled) return [];
    if (!appState.selectedGlyph) return [];
    return generatePath(
      appState.selectedGlyph.nodes,
      appState.selectedGlyph.edges,
      appState.trajectoryParams
    );
  });

  const drawPreview = debounce((canvas, strokes) => {
    const context = canvas.getContext("2d");
    context.reset();
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (annotatePath) {
      for (const stroke of strokes) {
        drawDebugPath(context, stroke);
      }
    } else {
      for (const _ of painter.drawPath(strokes, context)) {
      }
    }
  }, 25);

  return observer(
    ({ width, height }) =>
      html`<${GlyphPreview}
        width=${width}
        height=${height}
        strokes=${strokes.get()}
        drawPreview=${drawPreview}
      />`
  );
}

const GlyphPreview = ({ width, height, strokes, drawPreview }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawPreview(canvas, strokes);
  }, [canvasRef.current, width, height, strokes, drawPreview]);

  return html`<canvas
    ref=${canvasRef}
    width=${width}
    height=${height}
    style="pointer-events:none"
  />`;
};

function drawDebugPath(context, stroke) {
  context.beginPath();
  let lastAnnotatedVertex = null;
  let index = 0;
  for (const vertex of stroke.vertices) {
    const to = index === 0 ? context.moveTo : context.lineTo;
    to.call(context, vertex.x, vertex.y);
    if (annotatePath) {
      if (
        !lastAnnotatedVertex ||
        Math.hypot(
          lastAnnotatedVertex.x - vertex.x,
          lastAnnotatedVertex.y - vertex.y
        ) > 20
      ) {
        context.fillStyle = "#f00";
        context.font = "bold 10px sans-serif";
        const slope = lastAnnotatedVertex
          ? (lastAnnotatedVertex.y - vertex.y) /
            (lastAnnotatedVertex.x - vertex.x)
          : 0;
        context.textBaseline = slope < 0 ? "top" : "bottom";
        context.fillText(vertex.t.toFixed(1), vertex.x, vertex.y);
        lastAnnotatedVertex = vertex;
      }
    }
    index++;
  }
  context.fillStyle = null;
  context.lineWidth = annotatePath ? 2 : 20;
  context.strokeStyle = annotatePath ? "#f00" : "#cff";
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();
}
