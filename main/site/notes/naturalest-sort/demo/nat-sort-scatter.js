(() => {
  customElements.define(
    "nat-sort-scatter",
    class NatSortScatter extends HTMLElement {
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
        const result = await wordSort(words, { projectionType: "angular" });

        const prerender = new URLSearchParams(location.search).has("prerender");

        let chartHTML;
        if (prerender) {
          const { renderScatter } = await import("./render-scatter.js");
          const points = words.map((w) => result.projection.coords[w].slice(0, 2));
          chartHTML = renderScatter(words, points);
        } else {
          chartHTML = "<nat-sort-dynamic-chart></nat-sort-dynamic-chart>";
        }

        this.innerHTML = html`<div class="horizontal-scroll">
          ${html.raw(chartHTML)}
        </div>`;

        const dynamicChart = this.querySelector("nat-sort-dynamic-chart");
        if (dynamicChart) {
          const coords = result.projection.coords;
          const points = words.map(w => {
            const [x, y, z] = coords[w];
            return { x, y, z, label: w };
          });
          const xs = points.map(p => p.x);
          const ys = points.map(p => p.y);
          const extent = Math.max(
            -Math.min(...xs),
            Math.max(...xs),
            -Math.min(...ys),
            Math.max(...ys)
          ) * 1.05;
          dynamicChart.data = {
            points,
            lines: [
              { x1: -extent, y1: 0, z1: 0, x2: extent, y2: 0, z2: 0, tickInterval: extent * 2 / 10, hasArrowStart: true, hasArrowEnd: true },
              { x1: 0, y1: -extent, z1: 0, x2: 0, y2: extent, z2: 0, tickInterval: extent * 2 / 10, hasArrowStart: true, hasArrowEnd: true },
              { x1: 0, y1: 0, z1: -extent, x2: 0, y2: 0, z2: extent, tickInterval: extent * 2 / 10, hasArrowStart: true, hasArrowEnd: true },
            ],
          };
        }
      }
    },
  );
})();
