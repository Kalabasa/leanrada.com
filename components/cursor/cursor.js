const cursorKey = "cursorSelected";
const cursorNames = ["note", "sword", "boba"];
let cursorSelected = null;

export function setupCursor() {
  selectCursor(sessionStorage.getItem(cursorKey));
}

customElements.define(
  "cursor-provider",
  class CursorProvider extends HTMLElement {
    constructor() {
      super();

      this.innerHTML = html`
        <p><em>It’s dangerous to go alone!</em><br />Take these <strong>free cursors</strong>!</p>
        <button data-cursor="note"></button>
        <button data-cursor="sword"></button>
        <button data-cursor="boba"></button>
      `;

      appendStyle(
        this.tagName,
        html`<style>
          cursor-provider {
            display: block;
            padding: 0;
            margin: 0;
            text-align: center;

            p {
              font-style: initial;
              font-size: 18px;
              font-weight: normal;
              line-height: 27px;
              margin: 0 0 12px;
            }

            button {
              cursor: inherit;
              width: 60px;
              height: 60px;
              border: inset 4px var(--text-clr);
              background-color: var(--bg-clr);
              background-size: 24px 24px;
              background-position: center;
              background-repeat: no-repeat;
              image-rendering: pixelated;

              &:hover {
                border-color: var(--clr0);
                background-position: center calc(50% - 4px);
              }
            }
          }
        </style>`
      );
    }

    connectedCallback() {
      this.setAttribute("aria-hidden", "true");

      for (const button of this.querySelectorAll("button")) {
        button.addEventListener("click", () => {
          selectCursor(button.dataset.cursor);
        });
      }

      updateProviderButtons();
    }
  }
);

function selectCursor(name) {
  if (name && !cursorNames.includes(name)) return;

  if (name == null || cursorSelected === name) {
    cursorSelected = null;
    sessionStorage.removeItem(cursorKey);
    document.body.style.cursor = null;
  } else {
    cursorSelected = name;
    sessionStorage.setItem(cursorKey, name);
    document.body.style.cursor = `url('/icons/cursor_${name}.png'), auto`;
  }

  updateProviderButtons();
}

function updateProviderButtons() {
  for (const button of document.querySelectorAll("cursor-provider button")) {
    const name = button.dataset.cursor;
    const taken = cursorSelected === name;
    button.style.backgroundImage = taken
      ? null
      : `url('/icons/cursor_${name}.png')`;
  }
}
