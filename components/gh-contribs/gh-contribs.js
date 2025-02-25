(() => {
  customElements.define(
    "gh-contribs",
    class GithubContribs extends HTMLElement {
      constructor() {
        super();
        this.#load();
        appendStyle(
          this.tagName,
          html`<style>
            gh-contribs {
              display: grid;
              grid-auto-flow: column;
              grid-template-rows: repeat(7, auto);
              gap: 12px;
            }
            gh-contribs div {
              position: relative;
              width: 18px;
              height: 18px;
              border-radius: 2px;
              box-sizing: border-box;
              background: #222c2c;
              color: transparent;
              overflow: hidden;
              user-select: none;
            }
            gh-contribs div::after {
              content: "";
              position: absolute;
              inset: 0;
              background: var(--clr0-light, #54f8c1);
            }
            gh-contribs div[data-level="0"]::after {
              opacity: 0;
            }
            gh-contribs div[data-level="1"]::after {
              opacity: 0.3;
            }
            gh-contribs div[data-level="2"]::after {
              opacity: 0.6;
            }
            gh-contribs div[data-level="3"]::after {
              opacity: 1;
            }
          </style>`
        );
      }

      async #load() {
        const contribs = await fetch(
          "/components/gh-contribs/gh-contribs.json"
        ).then((res) => res.json());

        let htmlString = "";
        for (const col of contribs) {
          for (const level of col) {
            htmlString += html`<div data-level="${level}">${level}</div>`;
          }
        }
        this.innerHTML = htmlString;
      }
    }
  );
})();
