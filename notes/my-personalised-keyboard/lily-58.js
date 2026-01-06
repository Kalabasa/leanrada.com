(() => {
  const HOME_ROW_RIGHT = ["", "⌃", "⌥", "⌘", "⇧", ""];
  const BASE_LAYER = [
    // Left hand
    ["Esc", "⌃[", "⌃]", "⌃⇧Tab", "⌃Tab", ""],
    ["?", "q", "w", "f", "p", "b"],
    ["Tab", "a", "r", "s", "t", "g"],
    ["+", "z", "x", "c", "d", "v"],
    ["⌃", "L(s)", "⌘", "␣", "◆"],
    // Right hand
    ["L(e)", "Wksp←", "Wksp↑", "Wksp↓", "Wksp→", "⌫"],
    ["j", "l", "u", "y", "=", "'"],
    ["m", "n", "e", "i", "o", "↵"],
    ["k", "h", ".", ",", "/", "-"],
    ["◆", "␣", "L(n)", "L(#)", "L(f)"],
  ];

  const DATA = Object.create(null);
  DATA.BASE_LAYER = BASE_LAYER;
  DATA.SHIFT_LAYER = [
    // Left hand
    ["Esc", "~", "@", "#", "%", ""],
    ["!", "Q", "W", "F", "P", "B"],
    ["Tab", "A", "R", "S", "T", "G"],
    ["", "Z", "X", "C", "D", "V"],
    ["", "", "", "⇧", ""],
    // Right hand
    ["", "^", "&", "|", "\\", "⌫"],
    ["J", "L", "U", "Y", "_", '"'],
    ["M", "N", "E", "I", "O", "↵"],
    ["K", "H", ":", ";", "*", ""],
    ["", "␣", "", "", ""],
  ];
  const HOME_ROW_LAYER_LEFT = [
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    [...HOME_ROW_RIGHT].reverse(),
    ["", "", "", "", "", ""],
    ["", "", "", "", ""],
  ];
  const HOME_ROW_LAYER_RIGHT = [
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    HOME_ROW_RIGHT,
    ["", "", "", "", "", ""],
    ["", "", "", "", ""],
  ];
  DATA.HOME_ROW_LAYER = [
    // Left hand
    ...HOME_ROW_LAYER_LEFT,
    // Right hand
    ...HOME_ROW_LAYER_RIGHT,
  ].map((row, i) =>
    row.map(
      (key, j) => (key && BASE_LAYER[i][j] + "/" + key) || BASE_LAYER[i][j]
    )
  );
  DATA.SYMBOL_LAYER = [
    // Left hand
    ["", "", "", "", "", ""],
    ["`", "\\", "$", "{", "}", ""],
    ["<", "=", "-", "(", ")", ">"],
    ["", "", "", "[", "]", ""],
    ["", "L(s)", "", "", ""],
    // Right hand
    ...HOME_ROW_LAYER_RIGHT,
  ];
  DATA.NAVIGATION_LAYER = [
    // Left hand
    ...HOME_ROW_LAYER_LEFT,
    // Right hand
    ["", "", "", "⇧Tab", "Tab", "⌫"],
    ["W⌫", "W←", "WSel", "", "W→", ""],
    ["⌦", "←", "↑", "↓", "→", "↵"],
    ["", "Home", "PgUp", "PgDn", "End", ""],
    ["", "", "L(n)", "", ""],
  ];
  DATA.NUMBER_LAYER = [
    // Left hand
    ...HOME_ROW_LAYER_LEFT,
    // Right hand
    ["", "", "", "*", "/", "⌫"],
    ["", "", "7", "8", "9", "-"],
    ["", "0", "4", "5", "6", "↵"],
    ["", "+", "1", "2", "3", "."],
    ["", "", "", "L(#)", ""],
  ];
  DATA.FUNCTION_LAYER = [
    // Left hand
    ["", "QWERTY", "", "", "", ""],
    ["", "", "Linux", "", "macOS", ""],
    [...HOME_ROW_RIGHT].reverse(),
    ["", "", "", "", "", ""],
    ["", "", "", "", ""],
    // Right hand
    ["", "", "🔉-", "🔊+", "🔅-", "🔆+"],
    ["", "", "⏮️", "⏯️", "PrtScr", "⏭️"],
    ["", "🔇", "FB0", "FB1", "FB2", "FB3"],
    ["", "", "", "", "", ""],
    ["", "", "", "", "L(f)"],
  ];
  DATA.EMOJI_LAYER = [
    // Left hand
    ["Cancel", "", "", "", "", ""],
    ["", "😭", "👋", "🥺", "🎉", ""],
    ["", "😂", "😃", "🙂", "🤔", ""],
    ["", "", "", "", "", ""],
    ["", "", "", "", ""],
    // Right hand
    ["L(e)", "‘", "’", "“", "”", "❌"],
    ["", "👈", "☝", "👇", "👉", "👍"],
    ["", "←", "↑", "↓", "→", "✔"],
    ["", "⬅", "⬆", "⬇", "➡", "✅"],
    ["", "", "", "", ""],
  ];
  DATA.QWERTY_LAYER = [
    // Left hand
    ["Esc", "1", "2", "3", "4", "5"],
    ["`", "Q", "W", "E", "R", "T"],
    ["Tab", "A", "S", "D", "F", "G"],
    ["⇧", "Z", "X", "C", "V", "B"],
    ["⌃", "⌥", "⌘", "␣", ""],
    // Right hand
    ["6", "7", "8", "9", "0", "⌫"],
    ["Y", "U", "I", "O", "P", "-"],
    ["H", "J", "K", "L", "↑", "↵"],
    ["N", "M", ".", "←", "↓", "→"],
    ["Cancel", "␣", "◆", "", "Chat"],
  ];

  customElements.define(
    "lily-58",
    // This component is a mess because of multiple iterations piled on top of each other
    // 1. Base code that shows a static keyboard with ONE layer toggle via `layer-button` and `layerkeydatakey`.
    // 2. WebComponent migration (this was a plain script before).
    // 3. Fully simulated keyboard that doesn't interactive with the ONE layer toggle, has its own state & layers.
    class Lily58 extends HTMLElement {
      #currentLayerKey = "BASE_LAYER";
      #leftHalf = null;
      #rightHalf = null;

      constructor() {
        super();

        const oledLeft = this.getAttribute("oled-left");
        const oledRight = this.getAttribute("oled-right");
        const hasFocusRects = this.hasAttribute("focus-rects");
        const hasLayerButton = this.hasAttribute("layer-button");
        const layer =
          this.hasAttribute("layerkeydatakey") &&
          DATA[this.getAttribute("layerkeydatakey")];

        const keyDataKey = this.getAttribute("keydatakey");
        this.#currentLayerKey = keyDataKey;
        const keys = DATA[this.#currentLayerKey];

        const leftSlotHTML = html.raw(
          Array.from(this.querySelectorAll('[slot="left"]'))
            .map((e) => e.outerHTML)
            .join("")
        );
        const rightSlotHTML = html.raw(
          Array.from(this.querySelectorAll('[slot="right"]'))
            .map((e) => e.outerHTML)
            .join("")
        );
        const defaultSlotHTML = html.raw(
          Array.from(this.querySelectorAll(":not([slot])"))
            .map((e) => e.outerHTML)
            .join("")
        );

        const fullSim =
          keys === DATA.BASE_LAYER &&
          !layer &&
          !hasLayerButton &&
          !hasFocusRects;

        this.innerHTML = html`
          <div class="lily58-half-container">
            <div
              class="lily58-half lily58-left-half ${this.#halfClass(0)}"
              aria-label="Left half of keyboard"
            >
              ${this.#renderKeys({ halfIndex: 0, keys, layer, oledLeft })}
            </div>
            ${leftSlotHTML}
          </div>
          <div class="lily58-half-container">
            <div
              class="lily58-half lily58-right-half ${this.#halfClass(1)}"
              aria-label="Right half of keyboard"
            >
              ${this.#renderKeys({ halfIndex: 1, keys, layer, oledRight })}
            </div>
            ${rightSlotHTML}
          </div>
          ${defaultSlotHTML}
        `;

        this.#leftHalf = this.querySelector(".lily58-left-half");
        this.#rightHalf = this.querySelector(".lily58-right-half");
        const layerButtons = this.querySelectorAll(".lily58-layer-button");

        if (!layerButtons.length) {
          this.classList.add("lily58-no-layers");
        } else {
          let currentLayer = 0;
          this.classList.add("lily58-on-layer" + currentLayer);
          const toggleLayer = () => {
            this.classList.remove("lily58-on-layer" + currentLayer);
            currentLayer = 1 - currentLayer;
            this.classList.add("lily58-on-layer" + currentLayer);
          };
          for (const layerButton of layerButtons) {
            layerButton.addEventListener("click", toggleLayer);
          }
        }

        if (fullSim) {
          this.#initFullSim();
        }

        appendStyle(
          this.tagName,
          html`<style>
            lily-58 {
              display: flex;
              justify-content: center;
              flex-wrap: wrap;
              column-gap: var(--lily58-gap);
              row-gap: 30px;
              font-family: var(--default-font, monospace);
              font-size: 15px;
              touch-action: pan-x pan-y pinch-zoom;
              --lily58-gap: calc(30px + 6vw);
              /* bleed */
              position: relative;
              min-width: 100vw;
              left: calc(50% - 50vw);
            }

            lily-58.lily58-full-sim {
              filter: drop-shadow(
                0 0 60px rgba(from var(--clr0-light) r g b / 0.4)
              );
              transition: filter 0.5s;

              &:hover {
                filter: drop-shadow(
                  0 0 0 rgba(from var(--clr0-light) r g b / 0)
                );
                transition: filter 2s;
              }
            }

            lily-58 kbd {
              display: flex;
              justify-content: center;
              align-items: center;
              border-radius: 6px;
              width: 40px;
              height: 40px;
              line-height: 1;
              background: white;
              color: black;
              user-select: none;
            }

            lily-58.lily58-full-sim {
              margin-block: min(var(--lily58-gap), 25vh);

              kbd:not(:empty) {
                cursor: pointer;
                &:is(:hover, :focus-visible) {
                  background: #cccccc;
                  &.lily58-accent {
                    background: #34b5df;
                  }
                  &.lily58-shade {
                    background: #80abcc;
                  }
                }
                &:active {
                  animation: lily58-full-sim-press 0.1s
                    cubic-bezier(0.8, 0, 1, 1) both;
                }
              }
            }
            @keyframes lily58-full-sim-press {
              25% {
                translate: 0 2px;
              }
            }

            kbd.lily58-accent {
              background: #72cbe9;
            }
            kbd.lily58-shade {
              background: #bed4e5;
            }
            .lily58-no-layers kbd.lily58-nofocus,
            .lily58-on-layer0 kbd.lily58-nofocus,
            kbd:empty,
            .lily58-on-layer0 kbd:has(.lily58-layer0:empty),
            .lily58-on-layer1 kbd:has(.lily58-layer1:empty) {
              background: #787d80;
              color: #0006;
            }
            .lily58-half-container {
              display: inline-block;
            }
            .lily58-half {
              position: relative;
              width: 316px;
              height: 243px;
              filter: drop-shadow(0 4px 0 #4c5858);
            }
            .lily58-half-unfocused {
              opacity: 0.6;
              /* height: 0;
              overflow: none;
              visibility: hidden; */
            }
            .lily58-left-half .lily58-grid > kbd:nth-child(6n + 1),
            .lily58-right-half .lily58-grid > kbd:nth-child(6n) {
              position: relative;
              top: 10px;
            }
            .lily58-left-half .lily58-grid > kbd:nth-child(6n + 2),
            .lily58-right-half .lily58-grid > kbd:nth-child(6n + 5) {
              position: relative;
              top: 8px;
            }
            .lily58-left-half .lily58-grid > kbd:nth-child(6n + 3),
            .lily58-right-half .lily58-grid > kbd:nth-child(6n + 4) {
              position: relative;
              top: 2px;
            }
            .lily58-left-half .lily58-grid > kbd:nth-child(6n + 5),
            .lily58-right-half .lily58-grid > kbd:nth-child(6n + 2) {
              position: relative;
              top: 2px;
            }
            .lily58-left-half .lily58-grid > kbd:nth-child(6n),
            .lily58-right-half .lily58-grid > kbd:nth-child(6n + 1) {
              position: relative;
              top: 4px;
            }
            .lily58-grid {
              display: grid;
              gap: 6px;
              grid-template-columns: repeat(6, min-content);
              grid-template-rows: repeat(4, min-content);
            }
            .lily58-right-half .lily58-grid {
              position: relative;
              left: 46px;
            }
            .lily58-left-half .lily58-x0 {
              position: absolute;
              left: 113px;
              top: 186px;
            }
            .lily58-left-half .lily58-x1 {
              position: absolute;
              left: 159px;
              top: 186px;
            }
            .lily58-left-half .lily58-x2 {
              position: absolute;
              left: 205px;
              top: 186px;
            }
            .lily58-left-half .lily58-x3 {
              position: absolute;
              left: 264px;
              top: 180px;
              transform: rotate(30deg);
              height: 60px;
            }
            .lily58-left-half .lily58-x4 {
              position: absolute;
              left: 276px;
              top: 117px;
            }
            .lily58-right-half .lily58-x4 {
              position: absolute;
              right: 113px;
              top: 186px;
            }
            .lily58-right-half .lily58-x3 {
              position: absolute;
              right: 159px;
              top: 186px;
            }
            .lily58-right-half .lily58-x2 {
              position: absolute;
              right: 205px;
              top: 186px;
            }
            .lily58-right-half .lily58-x1 {
              position: absolute;
              right: 264px;
              top: 180px;
              transform: rotate(-30deg);
              height: 60px;
            }
            .lily58-right-half .lily58-x0 {
              position: absolute;
              right: 276px;
              top: 117px;
            }
            .lily58-oled {
              position: absolute;
              display: flex;
              justify-content: center;
              align-items: center;
              width: 40px;
              height: 85px;
              background-color: black !important;
              border: solid 1px #222;
            }
            .lily58-no-layers .lily58-oled:has(img),
            .lily58-on-layer0 .lily58-oled:has(img) {
              border-image: linear-gradient(
                  0,
                  #222,
                  #233 30%,
                  #566,
                  #233 70%,
                  #222
                )
                1;
            }
            .lily58-oled > img {
              width: 24px;
              height: 24px;
              object-fit: contain;
              image-rendering: pixelated;
              filter: drop-shadow(0 0 8px #cff5) drop-shadow(-4px 2px 1px #cff2)
                drop-shadow(4px -2px 1px #cff2);
            }
            .lily58-left-half .lily58-oled {
              left: 278px;
              top: 5px;
            }
            .lily58-right-half .lily58-oled {
              right: 278px;
              top: 5px;
            }
            .lily58-layer-button {
              position: relative;
              padding: 0;
              width: 100%;
              height: 100%;
              box-sizing: border-box;
              border: double 4px #0f0;
              border-radius: inherit;
              color: #0f0;
              background: #000c;
              font: inherit;
              line-height: inherit;
              cursor: pointer;
            }
            .lily58-layer-button:hover {
              background: #000a;
            }
            .lily58-layer1 .lily58-layer-button {
              filter: invert(1);
              background: #fffc;
            }
            .lily58-layer1 .lily58-layer-button:hover {
              background: #fffa;
            }
            /* larger touch target */
            .lily58-layer-button::after {
              content: "";
              position: absolute;
              inset: -5mm;
            }
            .lily58-layer0,
            .lily58-layer1,
            .lily58-text-size {
              display: inherit;
              justify-content: inherit;
              align-items: inherit;
              border-radius: inherit;
              width: 100%;
              height: 100%;
              line-height: inherit;
            }
            .lily58-layer1 {
              display: none;
            }
            .lily58-on-layer1 .lily58-layer1 {
              display: inherit;
            }
            .lily58-on-layer1 .lily58-layer0 {
              display: none;
            }

            .lily58-overlay {
              box-sizing: border-box;
              position: fixed;
              top: 0;
              height: 100lvh;
              left: 0;
              right: 0;
              padding: min(5lvh, 4vw) 2vw;
              display: flex;
              justify-content: start;
              align-content: end;
              flex-wrap: wrap-reverse;
              z-index: calc(infinity * 1px);
              pointer-events: none;

              kbd {
                display: grid;
                place-content: center;
                --lily58-preview-kbd-width: min(128px, 10vw);
                --lily58-preview-kbd-length: 1;
                width: var(--lily58-preview-kbd-width);
                height: var(--lily58-preview-kbd-width);
                margin-right: calc(var(--lily58-preview-kbd-width) * 0.1);
                margin-top: calc(var(--lily58-preview-kbd-width) * 0.2);
                border-radius: calc(var(--lily58-preview-kbd-width) * 0.2);
                font-size: calc(
                  1.25 *
                    (
                      var(--lily58-preview-kbd-width) /
                        max(3, var(--lily58-preview-kbd-length))
                    )
                );
                line-height: var(--lily58-preview-kbd-width);
                font-weight: bold;
                text-wrap: nowrap;
                color: #000;
                background: var(--lily58-preview-kbd-background);
                box-shadow: 0 calc(var(--lily58-preview-kbd-width) * 0.1) 0 #999,
                  var(--lily58-preview-kbd-box-shadow);
                overflow: hidden;

                animation: lily58-preview-kbd-enter 0.4s ease both;
                --lily58-preview-kbd-background: #fff;
                --lily58-preview-kbd-box-shadow: 0 0
                  calc(var(--lily58-preview-kbd-width) * 0.2) #0008;

                &.lily58-preview-kbd-modifier {
                  --lily58-preview-kbd-background: #ccc;
                }
                &.lily58-preview-kbd-exit {
                  animation: lily58-preview-kbd-exit 2s ease both;
                }
              }
            }

            @keyframes lily58-preview-kbd-enter {
              0% {
                width: var(--lily58-preview-kbd-width);
              }
              0%,
              75%,
              100% {
                animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
                translate: 0;
                background: var(--lily58-preview-kbd-background);
                box-shadow: 0 calc(var(--lily58-preview-kbd-width) * 0.1) 0 #999,
                  var(--lily58-preview-kbd-box-shadow);
              }
              25%,
              50% {
                animation-timing-function: cubic-bezier(0.2, 0, 1, 1);
                translate: 0 calc(var(--lily58-preview-kbd-width) * 0.1);
                background: lch(
                  from var(--lily58-preview-kbd-background) calc(l * 0.9) c h
                );
                box-shadow: 0 0 0 #999, var(--lily58-preview-kbd-box-shadow);
              }
              0% {
                opacity: 0;
              }
              20% {
                opacity: 1;
              }
              0% {
                color: transparent;
              }
              100% {
                color: #000;
              }
            }

            @keyframes lily58-preview-kbd-exit {
              0% {
                opacity: 1;
              }
              30% {
                width: var(--lily58-preview-kbd-width);
                margin-right: calc(var(--lily58-preview-kbd-width) * 0.1);
                opacity: 0;
              }
              100% {
                width: 0px;
                margin-right: 0px;
                opacity: 0;
              }
            }
          </style>`
        );
      }

      #getFocusRects() {
        return (
          this.hasAttribute("focus-rects") &&
          JSON.parse("[" + this.getAttribute("focus-rects") + "]")
        );
      }

      #halfClass(half) {
        const focusRects = this.#getFocusRects();
        if (focusRects) {
          // check if a focusRect intersects this half
          const [hx, hy, hw, hh] =
            half <= 0 ? /* left */ [0, 0, 6, 5] : /* right */ [0, 5, 6, 5];
          const intersects = focusRects.some(
            ([x, y, w, h]) =>
              x <= hx + hw && x + w >= hx && y <= hy + hh && y + h >= hy
          );
          if (!intersects) return "lily58-half-unfocused";
        }
        return "";
      }

      #renderKeys({ halfIndex, keys, oledLeft, oledRight, layer = null }) {
        let focusRow = -1;
        let focusCol = -1;
        if (this.contains(document.activeElement)) {
          focusRow = Number(document.activeElement.dataset.row ?? -1);
          focusCol = Number(document.activeElement.dataset.col ?? -1);
        }

        const layerButton =
          this.hasAttribute("layer-button") &&
          this.getAttribute("layer-button").split(",").map(Number);
        const focusRects = this.#getFocusRects();

        switch (halfIndex) {
          case 0:
            return html`<div class="lily58-grid">
                ${kbd(0, 0, "lily58-accent")} ${kbd(0, 1)} ${kbd(0, 2)}
                ${kbd(0, 3)} ${kbd(0, 4)} ${kbd(0, 5)} ${kbd(1, 0)} ${kbd(1, 1)}
                ${kbd(1, 2)} ${kbd(1, 3)} ${kbd(1, 4)} ${kbd(1, 5)}
                ${kbd(2, 0, "lily58-shade")} ${kbd(2, 1)} ${kbd(2, 2)}
                ${kbd(2, 3)} ${kbd(2, 4)} ${kbd(2, 5)} ${kbd(3, 0)} ${kbd(3, 1)}
                ${kbd(3, 2)} ${kbd(3, 3)} ${kbd(3, 4)} ${kbd(3, 5)}
              </div>
              ${kbd(4, 0, "lily58-x0 lily58-shade")}
              ${kbd(4, 1, "lily58-x1 lily58-shade")}
              ${kbd(4, 2, "lily58-x2 lily58-shade")}
              ${kbd(4, 3, "lily58-x3 lily58-shade")}
              ${kbd(4, 4, "lily58-x4 lily58-shade")}
              <div class="lily58-oled">${renderLeftOLED()}</div>`;

          case 1:
            return html`<div class="lily58-grid">
                ${kbd(5, 0)} ${kbd(5, 1)} ${kbd(5, 2)} ${kbd(5, 3)} ${kbd(5, 4)}
                ${kbd(5, 5, "lily58-shade")} ${kbd(6, 0)} ${kbd(6, 1)}
                ${kbd(6, 2)} ${kbd(6, 3)} ${kbd(6, 4)} ${kbd(6, 5)} ${kbd(7, 0)}
                ${kbd(7, 1)} ${kbd(7, 2)} ${kbd(7, 3)} ${kbd(7, 4)}
                ${kbd(7, 5, "lily58-accent")} ${kbd(8, 0)} ${kbd(8, 1)}
                ${kbd(8, 2)} ${kbd(8, 3)} ${kbd(8, 4)} ${kbd(8, 5)}
              </div>
              ${kbd(9, 0, "lily58-x0 lily58-shade")}
              ${kbd(9, 1, "lily58-x1 lily58-shade")}
              ${kbd(9, 2, "lily58-x2 lily58-shade")}
              ${kbd(9, 3, "lily58-x3 lily58-shade")}
              ${kbd(9, 4, "lily58-x4 lily58-shade")}
              <div class="lily58-oled">${renderRightOLED()}</div>`;
        }

        if (focusRow >= 0 && focusCol >= 0) {
          const next =
            this.querySelector(
              `kbd[data-row="${focusRow}"][data-col="${focusCol}"]`
            ) ?? this.querySelector('kbd[role="button"]');
          next?.focus();
        }

        function kbd(row, col, className = "") {
          // prettier-ignore
          return html`<kbd class="${className} ${kbdClass(row, col)}" ${kbdAsButton(row, col)}>${kbdContent(row, col)}</kbd>`;
        }

        // renders kbd class
        function kbdClass(row, col) {
          if (focusRects) {
            return isFocused(row, col) ? "lily58-focus" : "lily58-nofocus";
          }
          return "";
        }

        function isFocused(row, col) {
          return (
            !focusRects ||
            focusRects.some(
              ([x, y, w, h]) =>
                col >= x && col < x + w && row >= y && row < y + h
            )
          );
        }

        function kbdAsButton(row, col) {
          if ((focusRects && !isFocused(row, col)) || !keys[row][col]) return;
          return `tabindex="0" role="button" data-row="${row}" data-col="${col}"`;
        }

        // renders kbd content
        function kbdContent(row, col) {
          const value = keys[row][col];
          const content = renderContent(value, row, col);

          if (layer) {
            const layerValue = layer[row][col];
            const layerContent = renderContent(layerValue, row, col);
            // prettier-ignore
            return html`<div class="lily58-layer0">${renderTextSize(value, content)}</div>
        <div class="lily58-layer1">${renderTextSize(layerValue, layerContent)}</div>`;
          } else {
            return renderTextSize(value, content);
          }
        }

        function renderContent(value, row, col) {
          let content = value;
          if (layerButton && layerButton[0] === row && layerButton[1] === col) {
            content = html`<button class="lily58-layer-button">
              ${content}
            </button>`;
          }

          return content;
        }

        function renderTextSize(value, content) {
          const length = Intl.Segmenter
            ? [...new Intl.Segmenter().segment(value)].length
            : [...value].length;

          const maxLengthForFullSizedText = 2;

          if (length <= maxLengthForFullSizedText) {
            return html`${content}`;
          } else {
            const size =
              50 + Math.floor(50 / (1 + length - maxLengthForFullSizedText));
            const weightRule = length > 3 ? "font-weight:bold;" : "";

            return html`<span
              class="lily58-text-size"
              style="font-size:${size}%;${weightRule}"
            >
              ${content}
            </span>`;
          }
        }

        function renderLeftOLED() {
          if (!oledLeft) return "";
          return html`<img alt="" class="lily58-layer0" src="${oledLeft}" />`;
        }

        function renderRightOLED() {
          if (!oledRight) return "";
          return html`<img alt="" class="lily58-layer0" src="${oledRight}" />`;
        }
      }

      #initFullSim() {
        this.classList.add("lily58-full-sim");

        const overlay = document.createElement("div");
        overlay.classList.add("lily58-overlay");
        document.body.appendChild(overlay);

        this.addEventListener("contextmenu", (event) => {
          event.preventDefault();
        });

        let os = { value: "macos" };
        this.#setOLEDBaseOS(os);

        const modifiers = {
          "⌃": () => "Ctrl",
          "⌥": () => (os.value === "macos" ? "Option" : "Alt"),
          "⇧": () => "Shift",
          "◆": () => (os.value === "macos" ? "Command" : "Super"),
          "⌘": () => modifiers[getPrimaryMod(os)](),
        };

        const wSelSub = () => [
          `${getWordMod(os)}←`,
          `${getWordMod(os)}→`,
          `⇧`,
          `${getWordMod(os)}←`,
        ];

        const subs = {
          "⌃[": () => `${getPrimaryMod(os)}[`,
          "⌃]": () => `${getPrimaryMod(os)}]`,
          "Wksp←": () => `${getDesktopMod(os)}←`,
          "Wksp↑": () => `${getDesktopMod(os)}↑`,
          "Wksp↓": () => `${getDesktopMod(os)}↓`,
          "Wksp→": () => `${getDesktopMod(os)}→`,
          "W⌫": () => [...wSelSub(), "Backspace"],
          "W←": () => `${getWordMod(os)}←`,
          WSel: wSelSub,
          "W→": () => `${getWordMod(os)}→`,
          "⌫": () => "Backspace",
          "⌦": () => "Delete",
          "↵": () => "Enter",
        };

        const tapHoldMs = 300;

        const homeRowModTapHold = (tapInput, mod) => {
          if (this.#currentLayerKey !== "BASE_LAYER") return "pass";
          sendOnUp = tapInput;
          setTimeout(() => {
            if (!keyIsDown || sendOnUp !== tapInput) return;
            sendOnUp = null;
            sendInput(mod);
          }, tapHoldMs);
        };

        const shift = (rawKey, layerKey) => {
          if (this.#currentLayerKey !== layerKey) return "pass";
          sendInput(["⇧", rawKey]);
        };

        const callbacks = {
          "␣": (kbd) => {
            if (this.#currentLayerKey !== "BASE_LAYER") return "pass";
            if (!this.#leftHalf.contains(kbd)) return "pass";
            sendOnUp = "␣";
            setTimeout(() => {
              if (!keyIsDown) return;
              sendOnUp = null;
              this.#toggleLayer("SHIFT_LAYER", os);
              sendInput("⇧");
              callbacks["⇧"] = () => {
                delete callbacks["⇧"];
                this.#toggleLayer("BASE_LAYER", os);
              };
            }, tapHoldMs);
          },
          a: () => homeRowModTapHold("a", "⇧"),
          r: () => homeRowModTapHold("r", "⌘"),
          s: () => homeRowModTapHold("s", "⌥"),
          t: () => homeRowModTapHold("t", "⌃"),
          n: () => homeRowModTapHold("n", "⌃"),
          e: () => homeRowModTapHold("e", "⌥"),
          i: () => homeRowModTapHold("i", "⌘"),
          o: () => homeRowModTapHold("o", "⇧"),
          "?": () => shift("/", "BASE_LAYER"),
          "+": () => shift("=", "BASE_LAYER"),
          "~": () => shift("`", "SHIFT_LAYER"),
          "@": () => shift("2", "SHIFT_LAYER"),
          "#": () => shift("3", "SHIFT_LAYER"),
          "%": () => shift("5", "SHIFT_LAYER"),
          "^": () => shift("6", "SHIFT_LAYER"),
          "&": () => shift("7", "SHIFT_LAYER"),
          "|": () => shift("\\", "SHIFT_LAYER"),
          _: () => shift("-", "SHIFT_LAYER"),
          "!": () => shift("1", "SHIFT_LAYER"),
          '"': () => shift("'", "SHIFT_LAYER"),
          ":": () => shift(";", "SHIFT_LAYER"),
          "*": () => shift("8", "SHIFT_LAYER"),
          $: () => shift("4", "SYMBOL_LAYER"),
          "{": () => shift("[", "SYMBOL_LAYER"),
          "}": () => shift("]", "SYMBOL_LAYER"),
          "<": () => shift(",", "SYMBOL_LAYER"),
          "(": () => shift("9", "SYMBOL_LAYER"),
          ")": () => shift("0", "SYMBOL_LAYER"),
          ">": () => shift(".", "SYMBOL_LAYER"),
          "L(s)": () => this.#toggleLayer("SYMBOL_LAYER", os),
          "L(e)": () => this.#toggleLayer("EMOJI_LAYER", os),
          "L(n)": () => this.#toggleLayer("NAVIGATION_LAYER", os),
          "L(#)": () => this.#toggleLayer("NUMBER_LAYER", os),
          "L(f)": () => this.#toggleLayer("FUNCTION_LAYER", os),
          QWERTY: () => this.#toggleLayer("QWERTY_LAYER", os),
          Cancel: () => this.#toggleLayer("BASE_LAYER", os),
          Chat: () => {
            this.#toggleLayer("BASE_LAYER", os);
            const exitChat = () => {
              this.#toggleLayer("QWERTY_LAYER", os);
              delete callbacks["↵"];
              delete callbacks.Esc;
              return "pass";
            };
            callbacks.Esc = exitChat;
            callbacks["↵"] = exitChat;
          },
          Linux: () => {
            os.value = "linux";
            this.#setOLEDBaseOS(os);
          },
          macOS: () => {
            os.value = "macos";
            this.#setOLEDBaseOS(os);
          },
          "🔉-": () => {
            changeVolume(-10);
            return "pass";
          },
          "🔊+": () => {
            changeVolume(+10);
            return "pass";
          },
          "🔇": () => {
            toggleVolume();
            return "pass";
          },
          "🔅-": () => {
            changeBrightness(-10);
            return "pass";
          },
          "🔆+": () => {
            changeBrightness(+10);
            return "pass";
          },
          FB0: () => {},
          FB1: () => {},
          FB2: () => {},
          FB3: () => {},
        };

        let keyIsDown = false;
        let sendOnUp = null;

        this.addEventListener("pointerup", (event) => {
          const kbd = event.target.closest("kbd");
          let input = kbd?.innerText.trim();
          if (!input) return;

          keyIsDown = false;

          handleKeyUp();
          event.preventDefault();
        });

        this.addEventListener("pointerdown", (event) => {
          const kbd = event.target.closest("kbd");
          let input = kbd?.innerText.trim();
          if (!input) return;

          keyIsDown = true;
          sendOnUp = null;

          handleKeyDown(kbd, input);
          event.preventDefault();
        });

        this.addEventListener("keydown", (event) => {
          const kbd = event.target.closest("kbd");
          let input = kbd?.innerText.trim();
          if (!input) return;

          let row = Number(kbd.dataset.row);
          let col = Number(kbd.dataset.col);

          const isUp = event.key === "ArrowUp";
          const isDown = event.key === "ArrowDown";
          const isLeft = event.key === "ArrowLeft";
          const isRight = event.key === "ArrowRight";
          if (isUp || isDown || isLeft || isRight) {
            const isLandscape =
              this.#leftHalf.offsetTop === this.#rightHalf.offsetTop;

            let next = null;
            search: for (let f = 1; f < 8; f++) {
              for (let s = 0; s < 8; s++) {
                const searchSide = Math.ceil(s / 2) * ((s % 2) * 2 - 1);
                let searchRow = row + (isUp ? -f : isDown ? f : searchSide);
                let searchCol = col + (isLeft ? -f : isRight ? f : searchSide);

                // the markup is laid out that halves are stacked in rows (portrait)
                // need special behaviour when landscape
                if (isLandscape) {
                  // keep within same half when moving rows
                  if (searchRow < 5 !== row < 5) {
                    continue;
                  }
                  // go to other half when moving beyond columns
                  if (isLeft || isRight) {
                    const gap = 2;
                    if (searchRow >= 5 && searchRow < 10 && searchCol < -gap) {
                      searchCol += 6 + gap;
                      searchRow -= 5;
                    } else if (searchRow < 5 && searchCol >= 6 + gap) {
                      searchCol -= 6 + gap;
                      searchRow += 5;
                    }
                  }
                }

                next = this.querySelector(
                  `kbd[data-row="${searchRow}"][data-col="${searchCol}"]`
                );
                if (next) break search;
              }
            }

            if (next) next.focus();
            event.preventDefault();
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            keyIsDown = true;

            if (!event.repeat) {
              handleKeyDown(kbd, input);

              // the focused <kbd> gets replaced when layers change
              if (document.activeElement !== kbd) {
                const next =
                  this.querySelector(
                    `kbd[data-row="${row}"][data-col="${col}"]`
                  ) ?? this.querySelector('kbd[role="button"]');
                next?.focus();
              }
            }

            event.preventDefault();
            return;
          }
        });

        this.addEventListener("keyup", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            keyIsDown = false;
            handleKeyUp();
            event.preventDefault();
          }
        });

        const handleKeyDown = (kbd, input) => {
          playSound("keypress.wav", {
            pitch: Math.pow(2, Math.random() * 0.4 - 0.2),
            volume: 0.7 * Math.pow(2, Math.random() * 0.4 - 0.2),
          });

          if (callbacks[input] && callbacks[input](kbd) !== "pass") {
            return;
          }

          // special cases
          if (this.#currentLayerKey === "SHIFT_LAYER") {
            const uppercase = input.toUpperCase();
            // exclude 'unshifted' keys
            if (!";`\\".includes(input)) {
              if (input === uppercase) input = input.toLowerCase();
              input = ["⇧", input];
            }
          } else if (this.#currentLayerKey === "EMOJI_LAYER") {
            input = unicodeInput(input, os);
            this.#toggleLayer("BASE_LAYER", os);
          }

          if (subs[input]) {
            input = subs[input]();
          }

          sendInput(input);
        };

        const handleKeyUp = () => {
          if (sendOnUp) {
            this.#sendKey(overlay, sendOnUp);
            sendOnUp = null;
          }
        };

        const sendInput = async (input) => {
          const keyPresses = Array.isArray(input) ? input : [input];
          const endTime =
            Date.now() + Math.max(1500, Math.log2(keyPresses.length) * 1000);
          for (let keyPress of keyPresses) {
            while (modifiers[keyPress[0]]) {
              const modText = modifiers[keyPress[0]]();
              this.#sendKey(overlay, modText, endTime, true);
              await delay(20);
              keyPress = keyPress.slice(1);
            }
            if (keyPress) {
              this.#sendKey(overlay, keyPress, endTime);
              await delay(150);
            }
          }
        };
      }

      #sendKey(overlay, text, endTime = Date.now() + 1500, isModifier = false) {
        const previewKbd = document.createElement("kbd");
        previewKbd.innerText = text.trim();
        previewKbd.classList.toggle("lily58-preview-kbd-modifier", isModifier);
        previewKbd.style.setProperty(
          "--lily58-preview-kbd-length",
          previewKbd.innerText.length
        );

        if (previewKbd.innerText.length === 1) {
          previewKbd.innerText = previewKbd.innerText.toUpperCase();
        }

        const duration = endTime - Date.now();

        overlay.appendChild(previewKbd);
        setTimeout(
          () => previewKbd.classList.add("lily58-preview-kbd-exit"),
          duration
        );
        setTimeout(() => previewKbd.remove(), duration + 2000);
      }

      #toggleLayer(layerKey, os) {
        if (this.#currentLayerKey === layerKey) {
          layerKey = "BASE_LAYER";
        }
        this.#currentLayerKey = layerKey;
        const keys = DATA[this.#currentLayerKey];
        const oledLeft = {
          SYMBOL_LAYER: "symbol_layer_oled.png",
          SHIFT_LAYER: "shift_layer_oled.png",
          QWERTY_LAYER: "qwerty_mode_oled.png",
        }[this.#currentLayerKey];
        const oledRight = {
          EMOJI_LAYER: "emoji_layer_oled.png",
          NAVIGATION_LAYER: "navigation_layer_oled.png",
          NUMBER_LAYER: "number_layer_oled.png",
          FUNCTION_LAYER: "function_layer_oled.png",
          QWERTY_LAYER: "qwerty_mode_oled.png",
        }[this.#currentLayerKey];

        [this.#leftHalf, this.#rightHalf].forEach((half, halfIndex) => {
          half.innerHTML = this.#renderKeys({
            halfIndex,
            keys,
            oledLeft,
            oledRight,
          });
        });
        this.#setOLEDBaseOS(os);
      }

      #setOLEDBaseOS(os) {
        const background = os
          ? os.value === "macos"
            ? "url('macos_oled.png') 18px 12px / 6px 6px no-repeat"
            : "url('linux_oled.png') 12px 12px / 6px 6px no-repeat"
          : "none";
        this.querySelectorAll(".lily58-oled")[1].style.background = background;
      }
    }
  );

  function unicodeInput(input, os) {
    const unicodeHex =
      input.length === 1
        ? input.charCodeAt(0).toString(16)
        : (
            (input.charCodeAt(0) - 0xd800) * 0x400 +
            (input.charCodeAt(1) - 0xdc00) +
            0x10000
          ).toString(16);
    switch (os.value) {
      case "linux":
        return ["⌃⇧", "u", ...unicodeHex.split(""), "Enter"];
      case "macos":
        return ["⇧⌥", "=", ...unicodeHex.split("")];
      default:
        throw new Error("invalid os value", os);
    }
  }

  function getPrimaryMod(os) {
    switch (os.value) {
      case "linux":
        return "⌃";
      case "macos":
        return "◆";
      default:
        throw new Error("invalid os value", os);
    }
  }

  function getDesktopMod(os) {
    switch (os.value) {
      case "linux":
        return "⌃◆";
      case "macos":
        return "⌃";
      default:
        throw new Error("invalid os value", os);
    }
  }

  function getWordMod(os) {
    switch (os.value) {
      case "linux":
        return "⌃";
      case "macos":
        return "⌥";
      default:
        throw new Error("invalid os value", os);
    }
  }

  function delay(ms) {
    const resolver = Promise.withResolvers();
    setTimeout(resolver.resolve, ms);
    return resolver.promise;
  }

  let osd = null;
  let osdTimeout = null;

  function showOSD(title, progress) {
    if (!osd) {
      osd = document.createElement("div");
      osd.style.position = "fixed";
      osd.style.inset = 0;
      osd.style.pointerEvents = "none";
      osd.style.zIndex = "99990px";
      document.body.append(osd);
    }

    osd.innerHTML = html`<div
      style="position:fixed;left:50%;top:50%;translate:-50% -50%;display:flex;gap:10px;width:min(95vw,300px);background:#2224;color:#fff;padding:20px;border-radius:5px;font-family:system-ui;font-size:14px;backdrop-filter:blur(20px)"
    >
      ${title}
      <progress value="${progress}" style="flex:1 1 auto"></progress>
      <span style="flex:0 0 4ch">${Math.round(progress * 100)}%</span>
    </div>`;

    scheduleHideOSD();
  }

  function scheduleHideOSD() {
    clearTimeout(osdTimeout);
    osdTimeout = setTimeout(() => {
      osd.innerHTML = "";
    }, 1000);
  }

  let volume = 100;

  function changeVolume(delta) {
    volume = Math.max(0, Math.min(100, volume + delta));
    showOSD("Audio", volume / 100);
    playSound("popup.wav", { volume: volume / 100 });
  }

  function toggleVolume() {
    if (volume > 0) {
      changeVolume(-volume);
    } else {
      changeVolume(+100);
    }
  }

  let brightness = 100;
  let brightnessOverlay = null;

  function changeBrightness(delta) {
    brightness = Math.max(10, Math.min(100, brightness + delta));
    if (!brightnessOverlay) {
      brightnessOverlay = document.createElement("div");
      brightnessOverlay.style.position = "fixed";
      brightnessOverlay.style.inset = 0;
      brightnessOverlay.style.pointerEvents = "none";
      brightnessOverlay.style.zIndex = "calc(infinity * 1)";
      brightnessOverlay.style.transition = "background-color 0.1s";
      document.body.append(brightnessOverlay);
    }
    const opacity = 100 - brightness;
    brightnessOverlay.style.backgroundColor = `rgba(0, 0, 0, ${opacity}%)`;
    showOSD("Brightness", brightness / 100);
  }

  function playSound(src, { pitch = 1, volume = 1 }) {
    var sound = new Audio(src);
    sound.volume = volume;
    sound.playbackRate = pitch;
    sound.preservesPitch = false;
    sound.play();
    sound.addEventListener("ended", () => sound.remove());
  }
})();
