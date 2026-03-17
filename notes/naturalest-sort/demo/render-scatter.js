export function renderScatter(labels, points) {
  const w = 400;
  const h = 400;
  const padding = 48;
  const tickH = 3;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xMid = (xMin + xMax) / 2;
  const yMid = (yMin + yMax) / 2;
  const scale = Math.max(xMax - xMin, yMax - yMin) || 1;

  const sx = (x) => w / 2 + ((x - xMid) / scale) * (w - padding * 2);
  const sy = (y) => h / 2 - ((y - yMid) / scale) * (h - padding * 2);

  const dataLeft = sx(xMin) - padding * 0.3;
  const dataRight = sx(xMax) + padding * 0.3;
  const dataTop = sy(yMax) - padding * 0.3;
  const dataBottom = sy(yMin) + padding * 0.3;

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const xTickStep = niceStep(xRange, 10);
  const yTickStep = niceStep(yRange, 10);
  const xTickPad = xRange * 0.05;
  const yTickPad = yRange * 0.05;

  const ox = w / 2;
  const oy = h / 2;

  const xTicks = [];
  for (let v = Math.ceil((xMin + xTickPad) / xTickStep) * xTickStep; v <= xMax - xTickPad; v += xTickStep) {
    const px = sx(v);
    xTicks.push(`<line x1="${px.toFixed(1)}" y1="${oy - tickH}" x2="${px.toFixed(1)}" y2="${oy + tickH}" stroke-width="1"/>`);
  }

  const yTicks = [];
  for (let v = Math.ceil((yMin + yTickPad) / yTickStep) * yTickStep; v <= yMax - yTickPad; v += yTickStep) {
    const py = sy(v);
    yTicks.push(`<line x1="${ox - tickH}" y1="${py.toFixed(1)}" x2="${ox + tickH}" y2="${py.toFixed(1)}" stroke-width="1"/>`);
  }

  const dots = points
    .map((p, i) => {
      const cx = sx(p[0]);
      const cy = sy(p[1]);
      const onRight = cx > w * 0.6;
      const tx = onRight ? cx - 7 : cx + 7;
      const anchor = onRight ? "end" : "start";
      return html`<g>
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7" fill="transparent"/>
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3"/>
        <text x="${tx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="${anchor}">${labels[i]}</text>
        <text class="coord" x="${tx.toFixed(1)}" y="${(cy + 14).toFixed(1)}" text-anchor="${anchor}">(${p[0].toFixed(2)}, ${p[1].toFixed(2)})</text>
      </g>`;
    });

  const arrowSize = 4;
  const axes = html`<defs>
      <marker id="scatter-arrow-end" markerWidth="${arrowSize}" markerHeight="${arrowSize * 2}" refX="${arrowSize}" refY="${arrowSize}" orient="auto">
        <path d="M0,0 L${arrowSize},${arrowSize} L0,${arrowSize * 2}" fill="none" stroke-width="1"/>
      </marker>
      <marker id="scatter-arrow-start" markerWidth="${arrowSize}" markerHeight="${arrowSize * 2}" refX="0" refY="${arrowSize}" orient="auto">
        <path d="M${arrowSize},0 L0,${arrowSize} L${arrowSize},${arrowSize * 2}" fill="none" stroke-width="1"/>
      </marker>
    </defs>
    <line x1="${dataLeft.toFixed(1)}" y1="${oy}" x2="${dataRight.toFixed(1)}" y2="${oy}" stroke-width="1" marker-start="url(#scatter-arrow-start)" marker-end="url(#scatter-arrow-end)"/>
    <line x1="${ox}" y1="${dataBottom.toFixed(1)}" x2="${ox}" y2="${dataTop.toFixed(1)}" stroke-width="1" marker-start="url(#scatter-arrow-start)" marker-end="url(#scatter-arrow-end)"/>
    ${html.raw(xTicks.join(""))}${html.raw(yTicks.join(""))}`;

  return html`<svg viewBox="0 0 ${w} ${h}">${axes}${html.raw(dots)}</svg>`;
}

function niceStep(range, maxTicks) {
  const rough = range / maxTicks;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / pow;
  const nice = normalized <= 1.5 ? 1 : normalized <= 3 ? 2 : normalized <= 7 ? 5 : 10;
  return nice * pow;
}
