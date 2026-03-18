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
          ${html.raw(renderScatter(words, points))}
        </div>`;
      }
    },
  );
})();
