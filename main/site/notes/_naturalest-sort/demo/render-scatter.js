export function renderScatter(labels, points) {
  const w = 400;
  const h = 400;
  const padding = 48;
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

  const dots = points
    .map((p, i) => {
      const cx = sx(p[0]);
      const cy = sy(p[1]);
      const onRight = cx > w * 0.6;
      const tx = onRight ? cx - 7 : cx + 7;
      const anchor = onRight ? "end" : "start";
      return html`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3"/>
        <text x="${tx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="${anchor}">${labels[i]}</text>`;
    });

  const ox = sx(0);
  const oy = sy(0);
  const arrowSize = 4;
  const axes = html`<defs>
      <marker id="scatter-arrow" markerWidth="${arrowSize}" markerHeight="${arrowSize * 2}" refX="${arrowSize}" refY="${arrowSize}" orient="auto">
        <path d="M0,0 L${arrowSize},${arrowSize} L0,${arrowSize * 2}" fill="none" stroke-width="1"/>
      </marker>
    </defs>
    <line x1="${padding / 2}" y1="${oy}" x2="${w - padding / 2}" y2="${oy}" stroke-width="1" marker-end="url(#scatter-arrow)"/>
    <line x1="${ox}" y1="${h - padding / 2}" x2="${ox}" y2="${padding / 2}" stroke-width="1" marker-end="url(#scatter-arrow)"/>`;

  return html`<svg width="${w}" height="${h}">${axes}${html.raw(dots)}</svg>`;
}
