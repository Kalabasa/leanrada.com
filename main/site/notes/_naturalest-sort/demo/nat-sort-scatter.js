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
        const { renderScatter } = await import("./render-scatter.js");

        const words = this.getAttribute("words").split(",");
        const result = await wordSort(words, { projectionType: "angular" });
        const points = words.map((w) => result.projection.planarPoints[w]);

        this.innerHTML = html`<div class="horizontal-scroll">
          <figure>
            ${html.raw(renderScatter(words, points))}
            ${html.raw(this.innerHTML)}
          </figure>
        </div>`;

        appendStyle(
          this.tagName,
          html`<style>
            nat-sort-scatter {
              display: block;

              figure {
                margin: auto;
                width: min-content;
              }

              svg {
                display: block;
                margin: auto;
                background: var(--card-clr);
                border-radius: var(--card-border-radius);
              }

              line, path {
                stroke: var(--text2-clr);
              }

              circle {
                fill: var(--clr0);
              }

              text {
                fill: var(--text-clr);
                font-size: 11px;
                font-family: var(--default-font);
              }
            }
          </style>`,
        );
      }
    },
  );
})();
