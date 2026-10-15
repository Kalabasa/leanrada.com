import { html } from "../components/html.js";

export function AppMenuButton() {
  return html`
    <style id=${AppMenuButton.name}>
      .appMenuButton {
        border: none;
        cursor: pointer;
        outline: none;
        position: relative;
        padding: 0 var(--size-xs);
        font-family: "Cubao Narrow", sans-serif;
        font-weight: normal;
        font-size: var(--font-size-l);
        letter-spacing: 0.02em;
        border-radius: var(--size-xs);
        background: none;
        color: #bd1003;
        overflow: hidden;
        box-shadow: 0 0.1em 0.2em #6408;
        z-index: 0;
        transform-origin: bottom;
        transition: none 0.04s ease-in;
        transition-property: box-shadow, transform;

        > span {
          display: block;
          line-height: 1.8em;
          transform: scaleY(2);
        }
        &::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: #f8f7f6;
          z-index: -1;
        }
        &::after {
          content: "";
          position: absolute;
          left: 5%;
          right: 5%;
          top: 10%;
          bottom: 10%;
          border-radius: 50%;
          background: #f8ed8d;
          z-index: -1;
        }
        &:focus-visible,
        &:hover {
          box-shadow: 0 0.1em 0.3em #6408;
          transform: scale(1.02);
        }
        &:active {
          box-shadow: 0 0.05em 0.05em #6408;
          transform: scale(1);
        }
      }
    </style>
    <button class="appMenuButton" type="button"><span>menu</span></button>
  `;
}
