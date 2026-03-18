(() => {
  customElements.define(
    "nat-sort-sandbox",
    class NatSortSandbox extends HTMLElement {
      #input;
      #output;
      #sortPromise = null;

      connectedCallback() {
        this.innerHTML = html`
        <auto-flex data-rss="hidden">
          <input type="text" placeholder="dawn noon dusk evening">
          <button appearance="button">Sort</button>
        </auto-flex>
        <output data-rss="interactive">Enter comma-separated words</output>`;

        this.#input = this.querySelector("input");
        this.#output = this.querySelector("output");
        this.querySelector("button").addEventListener("click", () => this.#sort());
        this.#input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") this.#sort();
        });

        appendStyle(
          this.tagName,
          html`<style>
            nat-sort-sandbox {
              display: block;
              border: solid 1px var(--card-clr);
              border-radius: var(--card-border-radius);
              padding: 24px;

              label {
                width: 100%;
              }

              input {
                flex: 1;
                padding: 6px 12px;
                border: solid 1px var(--text-clr);
                border-radius: 6px;
                background: transparent;
                color: var(--text-clr);
                font-family: inherit;
                font-size: inherit;
              }

              output {
                display: block;
                min-height: 650px;
                margin-top: 12px;
                text-align: center;
              }
              output:empty {
                display: none;
              }
              .error {
                color: var(--clr1);
              }

              svg {
                max-width: calc(100vw - 36px);
                width: 100%;
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
              .text2 {
                color: var(--text2-clr);
                fill: var(--text2-clr);
                font-size: 12px;
              }
              circle:where(:not([fill])),
              .correct {
                color: var(--clr0);
                fill: var(--clr0);
                stroke: var(--clr0);
              }
              .coord {
                opacity: 0;
              }
              g:hover .coord {
                opacity: 1;
              }
            }
          </style>`
        );

        this.#sort();
      }

      async #sort() {
        const raw = this.#input.value.trim();
        if (!raw) return;

        const words = raw.split(/[, ]/).map(w => w.trim()).filter(Boolean);

        this.#output.innerHTML = `Sorting&hellip;`;

        const thisPromise = import("./sort.js");
        this.#sortPromise = thisPromise;

        try {
          const { wordSort } = await thisPromise;
          if (this.#sortPromise !== thisPromise) return;
          if (words.length < 2) {
            this.#output.innerHTML = `<span class="error">Enter at least 2 words.</span>`;
            return;
          }
          const result = await wordSort(words);
          if (this.#sortPromise !== thisPromise) return;
          const sorted = result.toSorted();
          const coords = result.projection.coords;

          this.#output.innerHTML = `<div><b>Sorted:</b> ${sorted.join(", ")}</div><nat-sort-dynamic-chart></nat-sort-dynamic-chart>`;
          const chart = this.#output.querySelector("nat-sort-dynamic-chart");

          const points = sorted.map((w) => {
            const [x, y, z] = coords[w];
            return { x, y, z, label: w, color: "#54f8c1" };
          });
          const projLines = points.map((p) => ({
            x1: p.x, y1: 0, z1: 0,
            x2: p.x, y2: p.y, z2: p.z,
            color: p.color,
          }));
          const minX = Math.min(...points.map(p => p.x));
          const maxX = Math.max(...points.map(p => p.x));
          const minY = Math.min(...points.map(p => p.y));
          const maxY = Math.max(...points.map(p => p.y));
          const minZ = Math.min(...points.map(p => p.z));
          const maxZ = Math.max(...points.map(p => p.z));
          const rangeX = maxX - minX;
          const rangeY = maxY - minY;
          const rangeZ = maxZ - minZ;
          const axisLine = {
            x1: Math.min(minX - rangeX * 0.1, -rangeY / 3, -rangeZ / 3), y1: 0, z1: 0,
            x2: Math.max(maxX + rangeX * 0.1, rangeY / 3, rangeZ / 3), y2: 0, z2: 0,
            tickInterval: rangeX / 5, hasArrowEnd: true,
            labelEnd: result.projection.direction,
          };
          chart.data = {
            points,
            lines: [axisLine, ...projLines],
          };
          chart.rotatable = true;
          chart.baseTargetCamera = { rotX: 0.25, rotY: -0.25, scaleZ: 1 };
        } catch (e) {
          if (this.#sortPromise !== thisPromise) return;
          this.#output.innerHTML = html`<span class="error">${e.message}</span>`;
        }
      }
    }
  );
})();
