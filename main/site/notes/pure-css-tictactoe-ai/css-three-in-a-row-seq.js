customElements.define(
  "css-three-in-a-row-seq",
  class CSSThreeInARowSeq extends HTMLElement {
    constructor() {
      super();

      this.innerHTML = html`
        <form
          class="css-three-in-a-row-seq"
          data-rss="interactive"
          alt="interactive demo of three-in-a-row"
        >
          ${this.generateInputs()}
          <div class="css-three-in-a-row-seq-box">${this.generateGrids()}</div>
        </form>
      `;

      appendStyle(
        this.tagName,
        html`<style>
          css-three-in-a-row-seq {
            display: block;
          }
          .css-three-in-a-row-seq {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 400px;
          }
          .css-three-in-a-row-seq > input {
            position: absolute;
            opacity: 0;
            pointer-events: none;
            appearance: none;
          }
          .css-three-in-a-row-seq-box {
            position: relative;
            width: 400px;
            height: 400px;
          }
          .css-three-in-a-row-seq-grid {
            position: absolute;
            inset: 0;
            display: grid;
            grid-template: 1fr 1fr 1fr / 1fr 1fr 1fr;
            pointer-events: none;
          }
          .css-three-in-a-row-seq-grid > label {
            display: flex;
            justify-content: center;
            align-items: center;
            border: solid 4px var(--text2-clr);
            margin: 0 -4px -4px 0;
            font-family: var(--default-font);
            font-size: 100px;
            line-height: 1;
            cursor: pointer;
            color: transparent;
            transition: color 0.1s;
          }
          .css-three-in-a-row-seq-grid > label:hover {
            background-color: #fff1;
          }

          /* Rules for enabling the appropriate set of inputs per turn */

          .css-three-in-a-row-seq label[for^="css-three-in-a-row-seq-1"] {
            pointer-events: all;
          }
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-1"] {
            pointer-events: none;
          }
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"] {
            pointer-events: all;
          }
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"] {
            pointer-events: none;
          }
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-3"] {
            pointer-events: all;
          }

          /* Rules for showing markers */

          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"][value="1"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-1"][data-value="1"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"][value="2"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-1"][data-value="2"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"][value="3"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-1"][data-value="3"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"][value="4"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-1"][data-value="4"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"][value="5"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-1"][data-value="5"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"][value="6"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-1"][data-value="6"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"][value="7"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-1"][data-value="7"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"][value="8"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-1"][data-value="8"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-1"][value="9"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-1"][data-value="9"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"][value="1"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"][data-value="1"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"][value="2"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"][data-value="2"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"][value="3"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"][data-value="3"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"][value="4"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"][data-value="4"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"][value="5"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"][data-value="5"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"][value="6"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"][data-value="6"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"][value="7"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"][data-value="7"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"][value="8"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"][data-value="8"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-2"][value="9"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-2"][data-value="9"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-3"][value="1"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-3"][data-value="1"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-3"][value="2"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-3"][data-value="2"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-3"][value="3"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-3"][data-value="3"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-3"][value="4"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-3"][data-value="4"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-3"][value="5"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-3"][data-value="5"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-3"][value="6"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-3"][data-value="6"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-3"][value="7"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-3"][data-value="7"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-3"][value="8"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-3"][data-value="8"],
          .css-three-in-a-row-seq
            > input[name="css-three-in-a-row-seq-3"][value="9"]:checked
            ~ .css-three-in-a-row-seq-box
            label[for^="css-three-in-a-row-seq-3"][data-value="9"] {
            color: var(--text-clr);
          }
        </style>`
      );
    }

    generateInputs() {
      let inputs = "";
      for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 9; j++) {
          inputs += html`
            <input
              id="css-three-in-a-row-seq-${i}-${j}"
              type="radio"
              name="css-three-in-a-row-seq-${i}"
              value="${j}"
            />
          `;
        }
      }
      return html.raw(inputs);
    }

    generateGrids() {
      let grids = "";
      for (let i = 1; i <= 3; i++) {
        grids += html`
          <div class="css-three-in-a-row-seq-grid">
            ${this.generateLabels(i)}
          </div>
        `;
      }
      return html.raw(grids);
    }

    generateLabels(row) {
      let labels = "";
      for (let i = 1; i <= 9; i++) {
        labels += html`<label
          for="css-three-in-a-row-seq-${row}-${i}"
          data-value="${i}"
        >
          ${row}
        </label>`;
      }
      return html.raw(labels);
    }
  }
);
