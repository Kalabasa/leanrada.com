(() => {
  customElements.define(
    "nat-sort-demo",
    class NatSortDemo extends HTMLElement {
      #children = "";

      connectedCallback() {
        new IntersectionObserver((entries, observer) => {
          if (!entries[0].isIntersecting) return;
          observer.disconnect();
          this.#run();
        }).observe(this);

        const { preload } = import("./data.js");
        setTimeout(() => preload(), 5_000);

        this.#children = this.innerHTML;
        this.innerHTML = "<i>Loading word embeddings (25MB)&hellip;</i>";
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
          <figure>
            <table>
              <tr>
                <td colspan=2>${chart}
              <tr>
                <td><b>Sorted</b>
                <td class="text2-color"><code>${html.raw(output.map(formatOutput).join(",<wbr>"))}</code>
            </table>
            ${html.raw(this.#children)}
          </figure>
        </div>`;

        appendStyle(
          this.tagName,
          html`<style>
            nat-sort-demo {
              display: block;

              figure {
                margin: auto;
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
                max-width: calc(100vw - 36px);
                width: 540px;
                display: block;
                margin: auto;
              }

              line, path {
                stroke: var(--text2-clr);
              }
              text, .text {
                color: var(--text-clr);
                fill: var(--text-clr);
                font-size: 11px;
              }
              .text2 {
                color: var(--text2-clr);
                fill: var(--text2-clr);
                font-size: 11px;
              }
              circle:where(:not([fill])),
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
              .coord {
                opacity: 0;
              }
              g:hover .coord {
                opacity: 1;
              }
            }
          </style>`,
        );
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
