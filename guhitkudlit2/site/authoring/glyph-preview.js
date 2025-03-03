import { generatePath } from "../calligraphy/generate-path.js";
import { BasePainter } from "../calligraphy/painter.js";
import { html } from "../components/html.js";
import { useEffect, useRef } from "../lib/htm-preact.js";
import { computed } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { throttle } from "../util/throttle.js";

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

  const drawPreview = throttle((canvas, strokes) => {
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
    const debug = vertex.debug;
    const to = index === 0 ? context.moveTo : context.lineTo;
    to.call(context, vertex.x, vertex.y);
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
      context.fillText(debug.pen.t.toFixed(1), vertex.x, vertex.y);
      lastAnnotatedVertex = vertex;
    }
    index++;
  }
  context.fillStyle = null;
  context.lineWidth = 2;
  context.strokeStyle = "#f00";
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();

  context.lineWidth = 1;
  for (const vertex of stroke.vertices) {
    const debug = vertex.debug;
    context.beginPath();
    context.moveTo(vertex.x, vertex.y);
    context.lineTo(vertex.x + debug.pen.vel.x, vertex.y + debug.pen.vel.y);
    context.strokeStyle = "#00f";
    context.stroke();
    context.beginPath();
    context.moveTo(vertex.x + debug.pen.vel.x, vertex.y + debug.pen.vel.y);
    context.lineTo(
      vertex.x + debug.pen.vel.x + debug.pen.accel.x,
      vertex.y + debug.pen.vel.y + debug.pen.accel.y
    );
    context.strokeStyle = "#0ff";
    context.stroke();
    context.beginPath();
    context.moveTo(
      vertex.x + debug.pen.vel.x + debug.pen.accel.x,
      vertex.y + debug.pen.vel.y + debug.pen.accel.y
    );
    context.lineTo(
      vertex.x + debug.pen.vel.x + debug.pen.accel.x + debug.pen.jerk.x,
      vertex.y + debug.pen.vel.y + debug.pen.accel.y + debug.pen.jerk.y
    );
    context.strokeStyle = "#0f0";
    context.stroke();
  }
}
