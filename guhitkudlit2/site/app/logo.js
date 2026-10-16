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
            padding: 0.02em 0.05em;
            width: 100%;
            height: 100%;
            border-radius: 0.03em;
            font-family: "Cubao Regular", sans-serif;
            font-size: calc(100cqw / 3.5);
            line-height: 0.65em;
            font-weight: normal;
            background: #000;

            > div {
              background-image: linear-gradient(
                var(--color-green),
                var(--color-green) 40%,
                var(--color-bg) 40%,
                var(--color-bg) 54%,
                var(--color-orange) 54%,
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

    connectedCallback() {
      const width = this.getAttribute("width");
      const height = this.getAttribute("height");
      if (width) this.style.width = width;
      if (height) this.style.height = height;
    }
  },
);
