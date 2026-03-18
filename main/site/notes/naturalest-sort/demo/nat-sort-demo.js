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

        let chart = "";
        if (["order", "principal"].includes(result.projection.type)) {
          const { renderLinearGraph } = await import("./render-linear.js");
          chart = renderLinearGraph(result.projection, correct);
        } else if (result.projection.type === "angular" && result.projection.planarPoints) {
          const { renderScatter } = await import("./render-scatter.js");
          const points = output.map((w) => result.projection.planarPoints[w]);
          chart = renderScatter(output, points);
        }

        this.innerHTML = html`<div class="horizontal-scroll">
          <table>
            <tr>
              <td colspan=2>${chart}
            <tr>
              <td><b>Sorted</b>
              <td class="text2-color"><code>${html.raw(output.map(formatOutput).join(",<wbr>"))}</code>
          </table>
        </div>`;
      }
    }
  );

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
