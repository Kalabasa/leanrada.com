import { html } from "../components/html.js";

export function Logo() {
  return html`
    <style>
      .logo > h1 {
        margin: 0;
        padding: 0.2em;
        width: 3.82em;
        border-radius: 0.09em;
        font-family: "Cubao Regular", sans-serif;
        font-size: 1.6em;
        line-height: 0.7em;
        font-weight: normal;
        background: #000;
      }
      .logo > h1 > div {
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
      }
      .logo > h1 > div::first-line {
        font-family: "Cubao Wide", sans-serif;
        font-size: 0.84em;
      }
    </style>
    <div class="logo">
      <h1>
        <div>Guhit<br />Kudlit</div>
      </h1>
    </div>
  `;
}