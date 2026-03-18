(() => {
  import("./data.js").then(({ preload }) => setTimeout(() => preload(), 5_000));

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

        const projectionAttr = this.getAttribute("projection");
        if (projectionAttr) {
          opts.projectionType = projectionAttr;
        }

        this.innerHTML += `<div style="position:absolute;left:6px;top:6px;color:var(--clr1);font-size:10px">Loading interactive version&hellip;</div>`;

        const input = words.toSorted(() => Math.random() - 0.5);
        const result = await wordSort(input, opts);
        const output = result.toSorted();

        const reversible = ["angular", "principal"].includes(result.projection.type);
        const cyclic = result.projection.type === "angular";
        const forwardCorrect = findCorrect(output, words, cyclic);
        const backwardCorrect = reversible ? findCorrect(output, [...words].reverse(), cyclic) : [];
        const correct = backwardCorrect.filter(Boolean).length > forwardCorrect.filter(Boolean).length
          ? backwardCorrect : forwardCorrect;

        const formatOutput = (word, index) => {
          return html`<span class="${correct[index] ? "correct" : "wrong"}">${word}</span>`;
        };

        const mode = result.projection.type === "angular" ? "scatter" : "linear";
        const prerender = new URLSearchParams(location.search).has("prerender");

        let chartHTML;
        if (prerender) {
          if (mode === "linear") {
            const { renderLinearGraph } = await import("./render-linear.js");
            chartHTML = renderLinearGraph(result.projection, correct);
          } else {
            const { renderScatter } = await import("./render-scatter.js");
            const points = output.map((w) => result.projection.coords[w].slice(0, 2));
            chartHTML = renderScatter(output, points);
          }
        } else {
          chartHTML = `<div style="position:relative"><nat-sort-dynamic-chart></nat-sort-dynamic-chart><span style="position:absolute;top:6px;right:6px;font-size:12px;opacity:0.6"></span></div>`;
        }

        this.innerHTML = html`<div class="horizontal-scroll">
          <table>
            <tr>
              <td colspan=2>${html.raw(chartHTML)}
            <tr>
              <td><b>Order dir</b>
              <td class="text2-color">
                <div style="text-align:center">
                  <span style="padding-right:3px;border-top:solid 1px currentColor;position:relative">
                    <span style="position:absolute;display:block;top:-3px;right:0;width:4px;height:4px;rotate:45deg;border:solid currentColor;border-width:1px 1px 0 0;"></span>
                    ${result.projection.direction}
                  </span>
                </div>
            <tr>
              <td><b>Sorted</b>
              <td class="text2-color"><code>${html.raw(output.map(formatOutput).join(",<wbr>"))}</code>
          </table>
        </div>`;

        const dynamicChart = this.querySelector("nat-sort-dynamic-chart");
        if (dynamicChart) {
          const coords = result.projection.coords;
          if (mode === "scatter") {
            const points = output.map((w, i) => {
              const [x, y, z] = coords[w];
              return { x, y, z, label: w, color: getColor(correct[i] ? "--clr0" : "--clr1") };
            });
            const xs = points.map(p => p.x);
            const ys = points.map(p => p.y);
            const extent = Math.max(
              -Math.min(...xs), Math.max(...xs),
              -Math.min(...ys), Math.max(...ys)
            ) * 1.05;
            const wordLines = points.map((p, i) => {
              const nextIndex = (i + 1) % points.length;
              if (!correct[i] || !correct[nextIndex]) return;
              const q = points[nextIndex];
              return { x1: p.x, y1: p.y, z1: p.z, x2: q.x, y2: q.y, z2: q.z };
            }).filter(Boolean);
            dynamicChart.data = {
              points,
              lines: [
                { x1: -extent, y1: 0, z1: 0, x2: extent, y2: 0, z2: 0, tickInterval: extent * 2 / 10, hasArrowStart: true, hasArrowEnd: true },
                { x1: 0, y1: -extent, z1: 0, x2: 0, y2: extent, z2: 0, tickInterval: extent * 2 / 10, hasArrowStart: true, hasArrowEnd: true },
                { x1: 0, y1: 0, z1: -extent, x2: 0, y2: 0, z2: extent, tickInterval: extent * 2 / 10, hasArrowStart: true, hasArrowEnd: true },
                ...wordLines,
              ],
            };
          } else {
            const values = result.projection.values;
            const sorted = output.map((w, i) => ({ word: w, value: values[w], correct: correct[i] }));

            const truePoints = sorted.map((e, i) => {
              const [x, y, z] = coords[e.word];
              return { x, y, z, label: e.word, color: getColor(e.correct ? "--clr0" : "--clr1") };
            });
            const trueLines = truePoints.map((p) => {
              return {
                x1: p.x, y1: 0, z1: 0,
                x2: p.x, y2: p.y, z2: p.z,
                color: p.color,
              };
            });
            const trueLinesBlink = truePoints.map((p) => {
              return {
                x1: p.x, y1: 0, z1: 0,
                x2: p.x, y2: 0, z2: 0,
                color: p.color,
              };
            });
            const trueLinesBlink2 = truePoints.map((p) => {
              return {
                x1: p.x, y1: p.y, z1: p.z,
                x2: p.x, y2: p.y, z2: p.z,
                color: p.color,
              };
            });

            const rowSpacing = (Math.max(...truePoints.map(c => c.x)) - Math.min(...truePoints.map(c => c.x))) * 0.1;
            const byAbsY = [...sorted].sort((a, b) => Math.abs(coords[a.word][1]) - Math.abs(coords[b.word][1]));
            let aboveCount = 0;
            let belowCount = 0;
            const rowMap = new Map();
            for (const e of byAbsY) {
              const [, y] = coords[e.word];
              const above = y >= 0;
              const row = above ? ++aboveCount : ++belowCount;
              rowMap.set(e.word, (above ? 1 : -1) * row * rowSpacing);
            }
            const linearPoints = sorted.map((e) => ({
              x: coords[e.word][0],
              y: rowMap.get(e.word),
              z: coords[e.word][2],
              label: e.word,
              color: getColor(e.correct ? "--clr0" : "--clr1"),
            }));
            const linearLines = linearPoints.map((p) => ({
              x1: p.x, y1: 0, z1: 0,
              x2: p.x, y2: p.y, z2: p.z,
              color: p.color,
            }));

            const minX = Math.min(...truePoints.map(c => c.x));
            const maxX = Math.max(...truePoints.map(c => c.x));
            const minY = Math.min(...truePoints.map(c => c.y));
            const maxY = Math.max(...truePoints.map(c => c.y));
            const minZ = Math.min(...truePoints.map(c => c.z));
            const maxZ = Math.max(...truePoints.map(c => c.z));
            const rangeX = maxX - minX;
            const rangeY = maxY - minY;
            const rangeZ = maxZ - minZ;
            const tickInterval = rangeX / 5;
            const linearAxisLine = {
              x1: minX - rangeX * 0.1, y1: 0, z1: 0,
              x2: maxX + rangeX * 0.1, y2: 0, z2: 0,
              tickInterval, hasArrowEnd: true,
            };
            const trueAxisLine = {
              x1: Math.min(minX - rangeX * 0.1, -rangeY / 3, -rangeZ / 3), y1: 0, z1: 0,
              x2: Math.max(maxX + rangeX * 0.1, rangeY / 3, rangeZ / 3), y2: 0, z2: 0,
              tickInterval, hasArrowEnd: true,
              labelEnd: result.projection.direction,
            };

            const indicator = dynamicChart.nextElementSibling;
            const updateIndicator = () => {
              indicator.textContent = expanded ? "3 dimensions" : `1 dimension = ${result.projection.direction}`;
            }

            const linearData = { points: linearPoints, lines: [linearAxisLine, ...linearLines] };
            const trueData = { points: truePoints, lines: [trueAxisLine, ...trueLines] };
            const trueDataBlink = { points: truePoints, lines: [trueAxisLine, ...trueLinesBlink] };
            const trueDataBlink2 = { points: truePoints, lines: [trueAxisLine, ...trueLinesBlink2] };

            let expanded = false;
            let blinkInterval = null;
            let blinkPhase = 0;
            updateIndicator();
            dynamicChart.rotatable = false;
            dynamicChart.data = linearData;
            dynamicChart.addEventListener("click", () => {
              expanded = !expanded;
              updateIndicator();
              dynamicChart.rotatable = expanded;
              dynamicChart.baseTargetCamera = expanded ? { rotX: 0.5, rotY: -0.5, scaleZ: 1 } : { rotX: 0, rotY: 0, scaleZ: 1 };
              dynamicChart.data = expanded ? trueData : linearData;
              clearInterval(blinkInterval);
              blinkInterval = setInterval(() =>{
                if (!expanded) {
                  clearInterval(blinkInterval);
                } else {
                  switch (blinkPhase++ % 3) {
                    case 0: dynamicChart.data = trueDataBlink; break;
                    case 1: dynamicChart.data = trueDataBlink2; break;
                    case 2: dynamicChart.data = trueData; break;
                  }
                }
              }, 500);
            });
            dynamicChart.style.cursor = "pointer";
          }
        }
      }
    }
  );

  let cachedStyles = null;
  function getColor(prop) {
    if (!cachedStyles) cachedStyles = getComputedStyle(document.documentElement);
    return cachedStyles.getPropertyValue(prop).trim() || "#888";
  }

  function findCorrect(got, want, cyclic = false) {
    const n = want.length;
    const offset = cyclic ? want.indexOf(got[0]) : 0;
    let working = [...got];
    return got.map(w => {
      const wantIndex = (want.indexOf(w) - offset + n) % n;
      const workingIndex = working.indexOf(w);
      const gotIndex = got.indexOf(w);
      const correct =
        wantIndex === workingIndex
        && Math.abs(wantIndex - gotIndex) <= 1;
      if (wantIndex !== workingIndex) {
        working.splice(workingIndex, 1);
        working.splice(wantIndex, 0, w);
      }
      return correct;
    });
  }
})();
