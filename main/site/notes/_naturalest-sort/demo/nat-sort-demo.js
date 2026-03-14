(() => {
  customElements.define(
    "nat-sort-demo",
    class NatSortDemo extends HTMLElement {
      connectedCallback() {
        new IntersectionObserver((entries, observer) => {
          if (!entries[0].isIntersecting) return;
          observer.disconnect();
          this.#run();
        }).observe(this);
      }

      async #run() {
        const { wordSort } = await import("./sort.js");

        const words = this.getAttribute("words").split(",");

        const opts = {};

        const anchorPairAttr = this.getAttribute("anchor-pair");
        if (anchorPairAttr) {
          opts.anchorPair = anchorPairAttr.split(",");
        }

        const projection = this.getAttribute("projection");
        if (projection) {
          opts.projection = projection;
        }

        const input = words.toSorted(() => Math.random() - 0.5);
        const result = await wordSort(input, opts);
        const output = result.toSorted();

        const correct = findCorrect(output, words);

        const formatOutput = (word, index) => {
          return html`<span class="${correct[index] ? "correct" : "wrong"}">${word}</span>`;
        };

        const orderRow = this.hasAttribute("no-order-row")
          ? ""
          : html`<tr>
            <td><b>Ordered by</b>
            <td><code>${result.projection.direction}</code>`;

        const chart = result.projection.type === "order"
          ? renderLinearGraph(result.projection, correct)
          : "";

        this.innerHTML = html`<div class="horizontal-scroll">
          <figure>
            <table>
              <tr>
                <td colspan=2>${chart}
              ${orderRow}
              <tr>
                <td><b>Sorted</b>
                <td class="text2-color"><code>${html.raw(output.map(formatOutput).join(",<wbr>"))}</code>
            </table>
          </figure>
        </div>`;

        appendStyle(
          this.tagName,
          html`<style>
            nat-sort-demo {
              display: block;

              figure {
                margin: 0;
              }

              table {
                margin: 0 auto;
                table-layout: auto;
                border-collapse: collapse;
              }
              td {
                border: solid 1px var(--card-clr);
                padding: 3px 12px;
              }

              code {
                font-size: 95%;
                font-style: italic;
                font-family: var(--default-font);
              }

              svg {
                display: block;
                margin: auto;
              }

              line, path {
                stroke: var(--text2-clr);
              }
              text, .text {
                color: var(--text-clr);
                fill: var(--text-clr);
                font-size: 12px;
              }
              .correct {
                color: var(--clr0);
                fill: var(--clr0);
                stroke: var(--clr0);
              }
              .wrong {
                color: var(--clr1);
                fill: var(--clr1);
                stroke: var(--clr1);
              }
            }
          </style>`,
        );
      }
    }
  );

  function renderLinearGraph(projection, correct) {
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
    const showZero = min <= 12 && max >= 12;

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
        <text x="${zeroX}" y="${lineY - tickH - 3}" text-anchor="middle" font-size="9" font-family="Menlo,Consolas,monospace" fill="#999">0</text>
      ` : ""}
      ${html.raw(entries.map(({ value, correct }) => html`
        <circle class="${ correct ? "correct" : "wrong" }" cx="${x(value)}" cy="${lineY}" r="${dotR}"/>
      `))}
    `;

    const rows = entries.map(({ word, value, correct }) => {
      const rowY = y + rowH / 2;
      const svg = html`<text x="${x(value) - 3}" y="${rowY}" text-anchor="end">${word}</text>
        <line class="${ correct ? "correct" : "wrong" }"
          x1="${x(value)}"
          y1="${lineY + dotR}"
          x2="${x(value)}"
          y2="${rowY}"
          stroke-width="1" />
      `;
      y += rowH;
      return svg;
    });

    const totalH = y;
    return html`<svg width="${totalW}" height="${totalH}">${numberLine}${html.raw(rows)}</svg>`;
  }

  function niceStep(range, maxTicks) {
    const rough = range / maxTicks;
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / pow;
    const nice = normalized <= 1.5 ? 1 : normalized <= 3 ? 2 : normalized <= 7 ? 5 : 10;
    return nice * pow;
  }

  function findCorrect(got, want) {
    let working = [...got];
    return got.map(w => {
      const wantIndex = want.indexOf(w);
      const workingIndex = working.indexOf(w);
      const gotIndex = got.indexOf(w);
      const correct =
        wantIndex === workingIndex
        && Math.abs(wantIndex - gotIndex) <= 1;
      // make corrections as we go, so we don't mark all words after a single mistake
      if (wantIndex < workingIndex) {
        working.splice(workingIndex, 1);
        working.splice(wantIndex, 0, w);
      } else if (wantIndex > workingIndex) {
        working.splice(workingIndex, 1);
        working.splice(wantIndex, 0, w);
      }
      return correct;
    });
  }
})();
