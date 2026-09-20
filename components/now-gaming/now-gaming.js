customElements.define(
  "now-gaming",
  class NowGaming extends HTMLElement {
    constructor() {
      super();

      this.innerHTML = html`
        <img src="/components/now-gaming/placeholder.png" alt="none" />
        <span>recently played</span>
      `;

      appendStyle(
        this.tagName,
        html`<style>
          now-gaming {
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
            text-align: center;

            span {
              font-size: 16px;
              font-style: italic;
              color: var(--text2-clr);
            }

            img {
              max-width: calc(min(100%, 256px));
              height: 96px;
              object-fit: cover;
              border-radius: 12px;
              background-color: var(--card-clr);
              &[src$="placeholder.png"] {
                image-rendering: pixelated;
              }
            }
          }
        </style>`
      );
    }

    connectedCallback() {
      const intersectionObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) init();
      });
      intersectionObserver.observe(this);

      const init = () => {
        intersectionObserver.disconnect();
        const [status] = this.querySelectorAll("span");
        fetch("/components/now-gaming/steam-game.json")
          .then((res) => res.json())
          .then(({ name, imgSrc, lastUpdated }) => {
            const img = this.querySelector("img");
            img.src = imgSrc;
            img.alt = name;
            if (Date.now() - lastUpdated > 7 * /* days */ 864e5) {
              status.textContent = "last played";
            }
          })
          .catch(() => {});
      };
    }
  }
);
