(() => {
  customElements.define(
    "nat-sort-demo",
    class NatSortDemo extends HTMLElement {
      async connectedCallback() {
        const { wordSort } = await import("./sort.js");

        const words = this.getAttribute("words")
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean);

        const opts = {};

        const anchorPairAttr = this.getAttribute("anchor-pair");
        if (anchorPairAttr) {
          opts.anchorPair = anchorPairAttr
            .split(",")
            .map((w) => w.trim());
        }

        const projection = this.getAttribute("projection");
        if (projection) {
          opts.projection = projection;
        }

        const shuffled = words.toSorted(() => Math.random() - 0.5);
        const result = await wordSort(shuffled, opts);
        const sorted = result.toSorted();
        const expected = words;
        const pass = expected.every((w, i) => sorted[i] === w);

        const projectionName =
          opts.projection ?? "order";
        const projections =
          result.debug[projectionName + "Projections"];

        this.innerHTML = "";
        const cell = document.createElement("div");
        cell.className = "nat-sort-cell " + (pass ? "pass" : "fail");

        const header = document.createElement("div");
        header.className = "nat-sort-header";

        const indicator = document.createElement("span");
        indicator.className = "nat-sort-indicator";
        indicator.textContent = pass ? "ok" : "no";

        const expectedEl = document.createElement("span");
        expectedEl.className = "nat-sort-expected";
        expectedEl.textContent = expected.join(", ");

        const dirEl = document.createElement("span");
        dirEl.className = "nat-sort-direction";
        dirEl.textContent = result.direction;

        header.append(indicator, expectedEl, dirEl);

        const sortedEl = document.createElement("div");
        sortedEl.className = "nat-sort-sorted";
        sortedEl.textContent = sorted.join(", ");

        cell.append(header, sortedEl);

        if (projections) {
          const bars = document.createElement("div");
          bars.className = "nat-sort-bars";
          renderBarChart(bars, projections);
          cell.append(bars);
        }

        this.appendChild(cell);
      }
    }
  );

  function renderBarChart(container, projections) {
    const entries = Object.entries(projections).toSorted(
      ([, a], [, b]) => a - b
    );
    const vals = entries.map(([, v]) => v);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;

    for (const [key, val] of entries) {
      const pct = ((val - min) / range) * 100;
      const row = document.createElement("div");
      row.className = "nat-sort-bar-row";

      const label = document.createElement("span");
      label.className = "label";
      label.textContent = key;

      const barWrap = document.createElement("div");
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.width = pct.toFixed(1) + "%";
      barWrap.appendChild(bar);

      const valEl = document.createElement("span");
      valEl.className = "val";
      valEl.textContent = val.toFixed(3);

      row.append(label, barWrap, valEl);
      container.appendChild(row);
    }
  }

})();
