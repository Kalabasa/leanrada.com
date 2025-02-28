customElements.define(
  "feature-card-carousel",
  class FeatureCardCarousel extends HTMLElement {
    constructor() {
      super();

      this.innerHTML = html`
        <div class="card-carousel-btn-container">
          <button
            class="card-carousel-btn card-carousel-btn-prev"
            aria-label="Previous"
          >
            <span class="card-carousel-btn-symbol">&lt;&lt;</span>
          </button>
        </div>
        ${html.raw(this.innerHTML)}
        <div class="card-carousel-btn-container">
          <button
            class="card-carousel-btn card-carousel-btn-next"
            aria-label="Next"
          >
            <span class="card-carousel-btn-symbol">&gt;&gt;</span>
          </button>
        </div>
      `;

      // Note: this style is only for the buttons, container styles are in common.css
      appendStyle(
        this.tagName,
        html`<style>
          .card-carousel-btn-container {
            position: sticky;
            display: grid;
            inset: 0;
            width: 0;
            z-index: 1;
          }
          .card-carousel-btn {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 15mm;
            height: 15mm;
            box-sizing: border-box;
            border: none;
            background: var(--bg-clr);
            color: var(--text-clr);
            cursor: pointer;
            font-family: var(--display-font);
            font-size: 21px;
            font-weight: bold;
            text-shadow: 0 0 18px #000;
            opacity: 0;
            pointer-events: all;
            transition: opacity 80ms ease-out;
          }
          .card-carousel-btn-visible {
            opacity: 1;
          }
          feature-card-carousel:hover .card-carousel-btn {
            color: var(--clr0-light);
          }
          .card-carousel-btn:hover {
            color: var(--clr1);
          }
          .card-carousel-btn-next {
            align-self: end;
            right: calc(
              var(--feature-card-carousel-inline-padding) * -1 + 15mm
            );
            border-top-left-radius: 12px;
          }
          .card-carousel-btn-prev {
            left: calc(var(--feature-card-carousel-inline-padding) * -1);
            border-bottom-right-radius: 12px;
          }

          .card-carousel-btn-symbol {
            display: inline-block;
            pointer-events: none;
          }
          feature-card-carousel:hover
            .card-carousel-btn-next
            .card-carousel-btn-symbol {
            animation: card-carousel-btn-next-symbol 0.5s var(--ease) infinite
              alternate;
          }
          feature-card-carousel:hover
            .card-carousel-btn-prev
            .card-carousel-btn-symbol {
            animation: card-carousel-btn-prev-symbol 0.5s var(--ease) infinite
              alternate;
          }
          @keyframes card-carousel-btn-next-symbol {
            to {
              transform: translateX(0.5ch);
            }
          }
          @keyframes card-carousel-btn-prev-symbol {
            to {
              transform: translateX(-0.5ch);
            }
          }

          /* approximately select touch-based media */
          @media (hover: none) and (pointer: coarse) {
            .card-carousel-btn {
              display: none;
            }
          }
        </style>`
      );

      const nextButton = this.querySelector(".card-carousel-btn-next");
      const prevButton = this.querySelector(".card-carousel-btn-prev");

      this.addEventListener(
        "click",
        (event) => {
          const { target } = event;

          const isButton = target.classList.contains("card-carousel-btn");
          if (!isButton) return;

          const cards = this.querySelectorAll("feature-card");
          const stepUnitSize =
            (cards.item(1)?.offsetLeft ?? 0) - (cards.item(0)?.offsetLeft ?? 0);

          const isNext = target.classList.contains("card-carousel-btn-next");
          const delta =
            (isNext ? 1 : -1) *
            Math.max(1, Math.floor(this.offsetWidth / stepUnitSize)) *
            stepUnitSize;
          this.scrollBy({
            left: delta,
            behavior: "smooth",
          });

          updateButtons(delta);
        },
        { capture: true }
      );

      let debouncedScrollTimeout = null;
      this.addEventListener(
        "scroll",
        () => {
          if (debouncedScrollTimeout) clearTimeout(debouncedScrollTimeout);
          debouncedScrollTimeout = setTimeout(() => {
            updateButtons();
          }, 50);
        },
        { passive: true }
      );

      const updateButtons = (delta = 0) => {
        const cards = this.querySelectorAll("feature-card");
        const firstCard = cards.item(0);
        const lastCard = cards.item(cards.length - 1);

        const updatedScrollLeft = this.scrollLeft + delta;
        nextButton.classList.toggle(
          "card-carousel-btn-visible",
          lastCard.offsetLeft + lastCard.offsetWidth - updatedScrollLeft >
            this.offsetWidth + 60
        );
        prevButton.classList.toggle(
          "card-carousel-btn-visible",
          firstCard.offsetLeft - updatedScrollLeft < -6
        );
      };

      updateButtons();
    }
  }
);
