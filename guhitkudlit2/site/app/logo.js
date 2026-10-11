customElements.define(
  "app-logo",
  class AppLogo extends HTMLElement {
    constructor() {
      super();
      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
          }

          h1 {
            box-sizing: border-box;
            margin: 0;
            padding: 0.2em;
            width: 3.82em;
            border-radius: 0.09em;
            font-family: "Cubao Regular", sans-serif;
            font-size: 1.6em;
            line-height: 0.7em;
            font-weight: normal;
            background: #000;

            > div {
              background-image: linear-gradient(
                var(--color-green),
                var(--color-green) 35%,
                var(--color-bg) 35%,
                var(--color-bg) 55%,
                var(--color-orange) 55%,
                var(--color-orange)
              );
              color: transparent;
              background-clip: text;

              &::first-line {
                font-family: "Cubao Wide", sans-serif;
                font-size: 0.84em;
              }
            }
          }
        </style>
        <h1>
          <div>Guhit<br />Kudlit</div>
        </h1>
      `;
    }
  },
);
