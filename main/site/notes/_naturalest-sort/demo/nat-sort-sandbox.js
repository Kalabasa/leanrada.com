(() => {
  customElements.define(
    "nat-sort-sandbox",
    class NatSortSandbox extends HTMLElement {
      #input;
      #output;
      #sortPromise = null;

      connectedCallback() {
        this.innerHTML = html`
        <auto-flex>
          <input type="text" placeholder="low,medium,high">
          <button appearance="button">Sort</button>
        </auto-flex>
        <output>Enter comma-separated words</output>`;

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
                min-height: 170px;
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
              circle,
              .correct {
                color: var(--clr0);
                fill: var(--clr0);
                stroke: var(--clr0);
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

        const thisPromise = (async () => {
          const [{ wordSort }, { renderLinearGraph }] = await Promise.all([
            import("./sort.js"),
            import("./render-linear.js"),
          ]);
          return { wordSort, renderLinearGraph };
        })();
        this.#sortPromise = thisPromise;

        try {
          const { wordSort, renderLinearGraph } = await thisPromise;
          if (this.#sortPromise !== thisPromise) return;
          const result = await wordSort(words);
          if (this.#sortPromise !== thisPromise) return;
          if (words.length < 2) {
            this.#output.innerHTML = `<span class="error">Enter at least 2 words.</span>`;
            return;
          }
          const sorted = result.toSorted();
          const allCorrect = sorted.map(() => true);
          const chart = renderLinearGraph(result.projection, allCorrect);
          this.#output.innerHTML = html`${html.raw(chart)}<div><b>Sorted:</b> ${sorted.join(", ")}</div>`;
        } catch (e) {
          if (this.#sortPromise !== thisPromise) return;
          this.#output.innerHTML = html`<span class="error">${e.message}</span>`;
        }
      }
    }
  );
})();
