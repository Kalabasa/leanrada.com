export function renderLinearGraph(projection, correct) {
  const entries = Object.entries(projection.values).toSorted(
    ([, a], [, b]) => a - b
  ).map(([word,value], i) => ({
    word,
    value,
    correct: correct[i]
  }));
  const values = entries.map(e => e.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = (rawMax - rawMin) * 0.1 || 0.1;
  const min = Math.min(rawMin - pad, 0);
  const max = rawMax + pad;
  const range = max - min;

  const padX = 12;
  const chartLeft = padX + 12;
  const chartW = 380;
  const rowH = 12;
  const dotR = 3;
  const tickH = 3;
  const arrowSize = 4;
  const chartRight = chartLeft + chartW;
  const totalW = chartRight + padX;

  const x = (val) => chartLeft + ((val - min) / range) * chartW;

  const tickStep = niceStep(range, 20);
  const tickPadding = range * 0.05;
  const firstTick = Math.ceil((min + tickPadding) / tickStep) * tickStep;
  const ticks = [];
  for (let v = firstTick; v <= max - tickPadding; v += tickStep) {
    ticks.push(v);
  }

  const zeroX = x(0);
  const showZero = min + tickPadding <= 0 && max - tickPadding >= 0;

  let y = 12;

  const dirLabelY = y;
  const dirLabelH = 24;
  y += dirLabelH + 12;

  const lineY = y + tickH;
  y += tickH * 2 + 24;

  const numberLine = html`<defs>
      <marker id="arrow-left" markerWidth="${arrowSize}" markerHeight="${arrowSize * 2}" refX="0" refY="${arrowSize}" orient="auto">
        <path d="M${arrowSize},0 L0,${arrowSize} L${arrowSize},${arrowSize * 2}" fill="none" stroke-width="1"/>
      </marker>
      <marker id="arrow-right" markerWidth="${arrowSize}" markerHeight="${arrowSize * 2}" refX="${arrowSize}" refY="${arrowSize}" orient="auto">
        <path d="M0,0 L${arrowSize},${arrowSize} L0,${arrowSize * 2}" fill="none" stroke-width="1"/>
      </marker>
    </defs>
    <foreignObject x="${chartLeft}" y="${dirLabelY}" width="${chartW}" height="${dirLabelH}">
      <div xmlns="http://www.w3.org/1999/xhtml"
      class="text" style="text-align:center">
        <span style="padding-right:3px;border-top:solid 1px currentColor;position:relative">
          <div style="position:absolute;top:-3.45px;right:0;width:4px;height:4px;rotate:45deg;border:solid currentColor;border-width:1px 1px 0 0;"></div>
          ${projection.direction}
        </span>
      </div>
    </foreignObject>
    <line x1="${chartLeft}" y1="${lineY}" x2="${chartRight}" y2="${lineY}"
      stroke-width="1" marker-start="url(#arrow-left)" marker-end="url(#arrow-right)"/>
    ${html.raw(ticks.map(v => html`
      <line x1="${x(v)}" y1="${lineY - tickH}" x2="${x(v)}" y2="${lineY + tickH}" stroke-width="1"/>
    `))}
    ${showZero ? html`
      <line x1="${zeroX}" y1="${lineY - tickH}" x2="${zeroX}" y2="${lineY + tickH}" stroke-width="1.5"/>
      <text class="text2" x="${zeroX}" y="${lineY - tickH - 3}" text-anchor="middle">0</text>
    ` : ""}
  `;

  const rows = entries.map(({ word, value, correct }) => {
    const rowY = y + rowH / 2;
    const svg = html`<g>
      <circle cx="${x(value)}" cy="${lineY}" r="${dotR + 4}" fill="transparent"/>
      <circle class="${ correct ? "correct" : "wrong" }" cx="${x(value)}" cy="${lineY}" r="${dotR}"/>
      <text class="coord" x="${x(value)}" y="${lineY - dotR - 4}" text-anchor="middle">${value.toFixed(2)}</text>
      <text x="${x(value) - 3}" y="${rowY}" text-anchor="end">${word}</text>
      <line class="${ correct ? "correct" : "wrong" }"
        x1="${x(value)}"
        y1="${lineY + dotR}"
        x2="${x(value)}"
        y2="${rowY}"
        stroke-width="1" />
    </g>`;
    y += rowH;
    return svg;
  });

  const totalH = y;
  return html`<svg viewBox="0 0 ${totalW} ${totalH}">${numberLine}${html.raw(rows)}</svg>`;
}

function niceStep(range, maxTicks) {
  const rough = range / maxTicks;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / pow;
  const nice = normalized <= 1.5 ? 1 : normalized <= 3 ? 2 : normalized <= 7 ? 5 : 10;
  return nice * pow;
}
