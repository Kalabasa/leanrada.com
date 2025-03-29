(() => {
  customElements.define(
    "code-block",
    class CodeBlock extends HTMLElement {
      constructor() {
        super();
        this.#init();

        appendStyle(
          this.tagName,
          html`<style>
            code-block {
              margin-left: -18px; /* bleed for scroll */
              margin-right: -18px; /* bleed for scroll */
              padding: 0 18px; /* bleed for scroll */
              overflow-x: auto;

              pre {
                margin: 0;
              }

              code {
                display: inline-block;
                padding: 18px;
                min-width: 100%;
                box-sizing: border-box;
                border-radius: 18px;
                font-family: var(--default-font, monospace);
                font-size: 15px;
                line-height: 1.6;
                background: var(--card-clr);
                white-space: pre;
              }

              [wraptext] code {
                white-space: pre-wrap;
                overflow-wrap: anywhere;
              }

              /**
               * THEME
               * Modified by Kalabasa.
               * Based on:
               * a11y-dark theme for JavaScript, CSS, and HTML
               * Based on the okaidia theme: https://github.com/PrismJS/prism/blob/gh-pages/hemes/prism-okaidia.css
               * @author ericwbailey
               */

              .token.inserted:not(.prefix) {
                background: #00b6a71c;
                display: block;
              }
              .token.deleted:not(.prefix) {
                background: #df20631c;
                display: block;
              }

              .token.comment,
              .token.prolog,
              .token.doctype,
              .token.cdata {
                color: #628b9e;
                font-style: italic;
              }

              .token.punctuation {
                color: #fefefe;
              }

              .token.property,
              .token.tag,
              .token.constant,
              .token.symbol,
              .token.deleted {
                color: #ffa07a;
              }

              .token.boolean,
              .token.number {
                color: #00e0e0;
              }

              .token.selector,
              .token.attr-name,
              .token.string,
              .token.char,
              .token.builtin,
              .token.inserted {
                color: #abe338;
              }

              .token.operator,
              .token.entity,
              .token.url,
              .token.variable {
                color: #00e0e0;
              }

              .token.atrule,
              .token.attr-value,
              .token.function {
                color: #ffd700;
              }

              .token.keyword {
                color: #00e0e0;
              }

              .token.regex,
              .token.important {
                color: #ffd700;
              }

              .token.important,
              .token.bold {
                font-weight: bold;
              }

              .token.italic {
                font-style: italic;
              }

              .token.entity {
                cursor: help;
              }

              @media screen and (-ms-high-contrast: active) {
                .token.important {
                  background: highlight;
                  color: window;
                  font-weight: normal;
                }

                .token.atrule,
                .token.attr-value,
                .token.function,
                .token.keyword,
                .token.operator,
                .token.selector {
                  font-weight: bold;
                }

                .token.attr-value,
                .token.comment,
                .token.doctype,
                .token.function,
                .token.keyword,
                .token.operator,
                .token.property,
                .token.string {
                  color: highlight;
                }

                .token.attr-value,
                .token.url {
                  font-weight: normal;
                }
              }
            }
          </style>`
        );
      }

      async #init() {
        await import("/lib/vendor/prism.js");

        const language = this.getAttribute("language") ?? "clike";
        const languageCode = this.getAttribute("languagecode");
        // & > pre > code
        const code = this.firstElementChild?.firstElementChild;

        if (code) {
          code.innerHTML = Prism.highlight(
            code.textContent,
            Prism.languages[language],
            languageCode ?? language
          );
        }
      }
    }
  );
})();
