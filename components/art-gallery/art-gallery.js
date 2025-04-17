customElements.define(
  "art-gallery",
  class ArtGallery extends HTMLElement {
    #activeIndex = 0;

    constructor() {
      super();
      this.tabIndex = 0;

      appendStyle(
        this.tagName,
        html`<style>
          art-gallery {
            --fade-length: 240px;
            margin-block: var(--fade-length);
            position: relative;
            width: 100vw;
            height: 100lvh;
            left: 50%;
            translate: -50% 0;
            scroll-snap-align: center;
            display: grid;
            align-items: center;
            justify-items: center;
            grid-template-columns: 1fr;
            cursor: pointer;
            isolation: isolate;
            overflow-x: clip;
            perspective: 3000px;
            z-index: 200; /* above <site-header> */
            user-select: none;
            -webkit-tap-highlight-color: transparent;

            &::before {
              content: "";
              position: absolute;
              inset: calc(var(--fade-length) * -1) 0;
              background: linear-gradient(
                to bottom,
                transparent,
                #000 var(--fade-length),
                #000 calc(100% - var(--fade-length)),
                transparent
              );
            }

            &::after {
              content: "";
              position: absolute;
              display: block;
              inset: calc(var(--fade-length) * -1) 0;
              background-image: url("/components/art-gallery/cursor-right.png");
              background-size: 96px;
              background-position: center;
              background-repeat: no-repeat;
              animation: art-gallery-arrow 1.5s var(--ease) infinite;
              z-index: 1;
              transition: opacity 0.1s;
              cursor: pointer;
            }
            &:focus::after {
              opacity: 0;
              cursor: unset;
            }
            &:focus-visible::after {
              animation-play-state: paused;
              transition-duration: 0.4s;
              transition-delay: 0.4s;
            }

            img {
              grid-row: 1 / -1;
              grid-column: 1 / -1;
              border-radius: 3px;
              visibility: hidden;
              opacity: 0;
              mix-blend-mode: plus-lighter;
              max-width: min(100%, calc(80svh * var(--aspect-ratio, 1)));
              z-index: 1;
              transition: opacity 0.1s ease,
                transform 0.1s cubic-bezier(0.2, 0, 0.4, 1),
                filter 1s ease;

              @-moz-document url-prefix() {
                max-width: 100%; /* FF can't handle the expr above */
              }

              &.art-gallery-active {
                visibility: visible;
                opacity: 1;
                transition-duration: 0.1s, 0.1s, 1s;
              }
              .art-gallery-active + &,
              &:first-child:has(~ .art-gallery-active:last-child) {
                visibility: visible;
                transform: translateX(60px) rotate3d(0, 1, 0, 15deg);
              }
              &:has(+ .art-gallery-active),
              .art-gallery-active:first-child ~ &:last-child {
                visibility: visible;
                transform: translateX(-60px) rotate3d(0, 1, 0, -15deg);
              }
            }
            &:not(:focus) img.art-gallery-active {
              filter: brightness(0.8);
            }
            &:focus-visible img {
              outline: solid 4px var(--clr0);
              outline-offset: 6px;
            }
          }

          @keyframes art-gallery-arrow {
            50% {
              background-position: calc(50% + 24px) 50%;
            }
          }
        </style>`
      );

      this.#activate(this.#activeIndex);

      this.addEventListener("mousemove", this.#handleMouseMove);
      this.addEventListener("click", this.#handleClick);
      this.addEventListener("keydown", this.#handleKey);
    }

    #activate(index) {
      this.#activeIndex = index;
      Array.from(this.children).forEach((el, i) => {
        el.classList.toggle("art-gallery-active", index === i);
      });
    }

    #handleMouseMove = (event) => {
      const file =
        event.clientX - window.innerWidth / 2 < 0
          ? "cursor-left.png"
          : "cursor-right.png";
      this.style.cursor = `url("/components/art-gallery/${file}"), pointer`;
    };

    #handleClick = (event) => {
      event.preventDefault();
      this.#move(Math.sign(event.clientX - window.innerWidth / 2));
    };

    #handleKey = (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.#move(-1);
      } else if (
        event.key === "ArrowRight" ||
        event.key === " " ||
        event.key === "Enter"
      ) {
        event.preventDefault();
        this.#move(+1);
      }
    };

    #move(delta) {
      const length = this.childElementCount;
      this.#activate(
        (this.#activeIndex +
          delta +
          length * Math.max(0, Math.ceil(-delta / length))) %
          length
      );
    }
  }
);
