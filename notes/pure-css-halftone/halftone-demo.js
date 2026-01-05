(() => {
  customElements.define(
    "halftone-demo",
    class HalftoneDemo extends HTMLElement {
      constructor() {
        super();

        const mediasrc = this.getAttribute("mediasrc");
        const mediaTag = mediasrc.endsWith(".mp4") ? "video" : "img";
        const mediaAttrs =
          mediaTag === "video" ? "muted playsinline autoplay loop" : "";

        const grayscale = this.hasAttribute("grayscale");
        const separateK = this.hasAttribute("separate-k");

        const initialSize = this.getAttribute("size") ?? 5;
        const initialBleed =
          this.getAttribute("bleed") ??
          0.2 + (grayscale ? 0.8 : 0) + (separateK ? 0.2 : 0);

        this.classList.toggle("halftone-grayscale", grayscale);
        this.classList.toggle("halftone-separate-k", separateK);
        this.style.setProperty("--halftone-size", `${initialSize}px`);
        this.style.setProperty("--halftone-bleed", `${initialBleed}`);

        this.innerHTML = html`
          <div class="halftone-demo-box">
            <div class="halftone-demo">
              <${mediaTag} class="halftone-media" src="${mediasrc}" ${mediaAttrs} loading="lazy"></${mediaTag}>
              <div class="halftone-demo-ink"></div>
            </div>
            <div class="halftone-demo-k-layer">
              <${mediaTag} class="halftone-media" src="${mediasrc}" ${mediaAttrs} loading="lazy"></${mediaTag}>
            </div>
          </div>
        `;

        if (this.hasAttribute("can-disable")) {
          this.innerHTML += html`<label class="halftone-demo-control-row">
            Toggle effect
            <input
              type="checkbox"
              checked
              onchange="onChangeHalftoneDemoEnabled(event)"
            />
          </label>`;
        }
        if (this.hasAttribute("can-separate-k")) {
          this.innerHTML += html`<label class="halftone-demo-control-row">
            Separate K layer
            <input
              type="checkbox"
              ${separateK ? "checked" : ""}
              onchange="onChangeHalftoneDemoSeparateK(event)"
            />
          </label>`;
        }
        if (this.hasAttribute("can-resize")) {
          this.innerHTML += html`<label class="halftone-demo-control-row">
            Size
            <input
              type="range"
              min="4"
              max="20"
              value="${initialSize}"
              step="1"
              oninput="onInputHalftoneDemoSize(event)"
            />
          </label>`;
        }
        if (this.hasAttribute("can-change-bleed")) {
          this.innerHTML += html`<label class="halftone-demo-control-row">
            Bleed
            <input
              type="range"
              min="0.1"
              max="${grayscale ? 2 : 0.45}"
              value="${initialBleed}"
              step="0.01"
              oninput="onInputHalftoneDemoBleed(event)"
            />
          </label>`;
        }
        if (this.hasAttribute("can-rotate")) {
          this.innerHTML += html`<label class="halftone-demo-control-row">
            Rotation
            <input
              type="range"
              min="0"
              max="360"
              value="${0}"
              step="0.1"
              oninput="onInputHalftoneDemoRotation(event)"
            />
          </label>`;
        }

        appendStyle(
          this.tagName,
          html`<style>
            .halftone-demo-control-row {
              display: grid;
              grid-template-columns: 1fr 2fr;
              justify-items: start;
              align-items: center;
              font-weight: bold;
              padding: 6px 18px;
              line-height: 1.2;
            }

            halftone-demo {
              --halftone-separate-k: 0;
              display: block;
              position: relative;
              overflow: hidden;
            }

            .halftone-demo-box {
              display: block;
              position: relative;
              overflow: hidden;
              border-radius: 18px;
              filter: sepia(0.4);
            }
            .halftone-demo-box.halftone-disabled {
              filter: none;
            }
            halftone-demo:has(.halftone-demo-control-row) .halftone-demo-box {
              margin-bottom: 18px;
            }

            .halftone-separate-k {
              --halftone-separate-k: 1;
            }

            .halftone-demo,
            .halftone-demo-k-layer {
              --halftone-dot-size: calc(
                var(--halftone-size) * var(--halftone-bleed)
              );
              --halftone-color-dot-size: var(--halftone-dot-size);
              position: relative;
              margin: -18px;
              filter: brightness(
                  calc(
                    0.5 + var(--halftone-bleed) * 0.3 -
                      var(--halftone-separate-k) * 0.02
                  )
                )
                blur(calc(var(--halftone-size) * 0.1)) contrast(1000)
                blur(0.6px);
              overflow: hidden;
              border: solid 54px #fff;
              box-sizing: border-box;
            }
            .halftone-grayscale .halftone-demo {
              --halftone-color-dot-size: 0;
            }
            .halftone-disabled .halftone-demo {
              filter: none;
            }
            .halftone-disabled .halftone-media {
              filter: none !important;
            }
            .halftone-disabled .halftone-demo-k-layer {
              display: none !important;
            }
            @media (max-width: 800px) {
              .halftone-demo,
              .halftone-demo-k-layer {
                border-width: 36px;
              }
            }

            .halftone-demo-k-layer {
              display: none;
              position: absolute;
              inset: 0;
              mix-blend-mode: multiply;
            }
            .halftone-separate-k .halftone-demo-k-layer {
              display: block;
            }

            .halftone-demo > .halftone-media,
            .halftone-demo-k-layer > .halftone-media {
              display: block;
              width: 100%;
            }
            .halftone-demo > .halftone-media {
              filter: brightness(1.5);
            }
            .halftone-grayscale .halftone-demo > .halftone-media {
              filter: grayscale(1);
            }
            .halftone-separate-k .halftone-demo > .halftone-media {
              /* main layer is hues only */
              filter: invert(1) brightness(0.75) invert(1) saturate(2);
            }
            .halftone-demo-k-layer > .halftone-media {
              /* K layer is greyscale only */
              filter: grayscale(1) brightness(2);
            }

            .halftone-disabled .halftone-demo-ink {
              visibility: hidden;
            }
            .halftone-demo-ink {
              mix-blend-mode: screen;
            }
            .halftone-demo-ink::before,
            .halftone-demo-ink::after {
              content: "";
              position: absolute;
              inset: -30%;
              background-size: var(--halftone-size) var(--halftone-size);
              background-blend-mode: multiply;
              mix-blend-mode: multiply;
            }
            .halftone-demo-ink::before {
              transform: rotate(30deg);
              background-image: radial-gradient(
                  var(--halftone-dot-size) at 25% 75%,
                  #000,
                  #666,
                  #fff
                ),
                radial-gradient(
                  var(--halftone-color-dot-size) at 75% 25%,
                  #000,
                  #666,
                  #fff
                ),
                radial-gradient(
                  var(--halftone-color-dot-size) at 25% 25%,
                  #ff0,
                  #ff6,
                  #fff
                ),
                radial-gradient(
                  var(--halftone-color-dot-size) at 75% 75%,
                  #ff0,
                  #ff6,
                  #fff
                );
            }
            .halftone-demo-ink::after {
              transform: rotate(calc(-21deg + var(--halftone-rotation)))
                translateX(calc(var(--halftone-size) * 0.58));
              background-image: radial-gradient(
                  var(--halftone-color-dot-size) at 75% 25%,
                  #f0f,
                  #f6f,
                  #fff
                ),
                radial-gradient(
                  var(--halftone-color-dot-size) at 25% 75%,
                  #f0f,
                  #f6f,
                  #fff
                ),
                radial-gradient(
                  var(--halftone-color-dot-size) at 75% 75%,
                  #0ff,
                  #6ff,
                  #fff
                ),
                radial-gradient(
                  var(--halftone-color-dot-size) at 25% 25%,
                  #0ff,
                  #6ff,
                  #fff
                );
              transition: transform 100ms;
            }

            .halftone-separate-k .halftone-demo-ink::before {
              background-image: radial-gradient(
                  var(--halftone-color-dot-size) at 25% 25%,
                  #ff0,
                  #ff6,
                  #fff
                ),
                radial-gradient(
                  var(--halftone-color-dot-size) at 75% 75%,
                  #ff0,
                  #ff6,
                  #fff
                );
            }
            .halftone-demo-k-layer::after {
              content: "";
              position: absolute;
              inset: -30%;
              background-size: var(--halftone-size) var(--halftone-size);
              background-blend-mode: multiply;
              mix-blend-mode: screen;
              transform: rotate(30deg);
              background-image: radial-gradient(
                  var(--halftone-color-dot-size) at 25% 25%,
                  #000,
                  #666,
                  #ccc,
                  #fff
                ),
                radial-gradient(
                  var(--halftone-color-dot-size) at 75% 75%,
                  #000,
                  #fff
                );
            }
          </style>`
        );
      }
    }
  );
})();

function onChangeHalftoneDemoEnabled(event) {
  getHalftoneDemo(event.currentTarget)?.classList.toggle(
    "halftone-disabled",
    !event.currentTarget.checked
  );
}

function onChangeHalftoneDemoSeparateK(event) {
  getHalftoneDemo(event.currentTarget)?.classList.toggle(
    "halftone-separate-k",
    event.currentTarget.checked
  );
}

function onInputHalftoneDemoSize(event) {
  getHalftoneDemo(event.currentTarget)?.style.setProperty(
    "--halftone-size",
    event.currentTarget.value + "px"
  );
}

function onInputHalftoneDemoBleed(event) {
  getHalftoneDemo(event.currentTarget)?.style.setProperty(
    "--halftone-bleed",
    event.currentTarget.value
  );
}

function onInputHalftoneDemoRotation(event) {
  getHalftoneDemo(event.currentTarget)?.style.setProperty(
    "--halftone-rotation",
    event.currentTarget.value + "deg"
  );
}

const halftoneDemoBoxCacheKey = Symbol();
function getHalftoneDemo(from) {
  if (!(halftoneDemoBoxCacheKey in from)) {
    const selector = "halftone-demo";

    let found = null;
    let current = from;
    do {
      if (current.matches(selector)) found = current;
      if (!found) found = current.querySelector(selector);
      current = current.previousElementSibling ?? current.parentElement;
    } while (!found && current);

    from[halftoneDemoBoxCacheKey] = found;
  }
  return from[halftoneDemoBoxCacheKey];
}
