import("/components/article-reactions/article-reactions.js");

customElements.define(
  "article-footer",
  class ArticleFooter extends HTMLElement {
    constructor() {
      super();

      this.innerHTML = html`
        ${renderSig()}
        <div>
          <article-reactions></article-reactions>
          ${maybeRenderRss(this)}
        </div>
        ${maybeRenderSuggestions()}
      `;

      appendStyle(
        this.tagName,
        html`<style>
          article-footer {
            display: block;
            margin: auto;
            width: 100%;
            box-sizing: border-box;

            blockquote {
              margin: 60px auto;
              position: relative;
              padding: 0 18px;
              width: 100%;
              max-width: 700px;
              box-sizing: border-box;
              line-height: 21px;

              &::before {
                content: "❝";
                position: absolute;
                left: -15px;
                top: 0;
                font-size: 60px;
                opacity: 0.2;
              }
              a {
                font-weight: bold;
              }
              cite {
                white-space: nowrap;
                img {
                  position: relative;
                  top: 3px;
                }
              }
            }

            blockquote + div {
              display: flex;
              flex-wrap: wrap;
              align-items: stretch;
              gap: 24px;
              margin: 60px auto;
              padding: 0 18px;
              width: 100%;
              max-width: 900px;
              box-sizing: border-box;

              > * {
                flex: 1 1 350px;
              }
            }

            .rss-link {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              border: solid 1px var(--card-clr);
              border-radius: 6px;
              padding: 18px;

              p {
                margin: 0 auto 18px;
              }

              .rss-link-combo {
                display: flex;
                justify-content: center;
              }
              a {
                display: block;
                padding: 0 12px;
                border: solid 1px var(--clr0);
                border-top-left-radius: 12px;
                border-bottom-left-radius: 12px;
                box-sizing: border-box;
                height: 30px;
                line-height: 30px;
                font-size: 12px;
                color: var(--text2-clr);
              }
              button {
                height: 30px;
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
              }
            }

            article-suggestions {
              margin: 120px auto;
            }
          }
        </style>`
      );
    }
  }
);

function renderSig() {
  const path = window.location.pathname;

  const introClause = html`Thanks for reading! `;
  const guestbookClause = html`Oh, and before you go, sign
    <a href="/guestbook/">the guestbook</a>! `;
  const closingClause = html`See you around!
    <cite><i>&mdash;Lean</i><img src="/icons/sig.png" alt="liyan" /></cite>`;

  let body = "";
  if (path.startsWith("/notes/")) {
    body = html`I like making interactive visualisations for my
      <a href="/notes/">programming blog</a>. Sometimes I do
      <a href="/wares/">projects</a> too. `;
  } else if (path.startsWith("/wares/")) {
    body = html`I like making <a href="/wares/">software projects</a>. I also
      keep a visual & interactive <a href="/notes/">programming blog</a>! `;
  } else {
    body = html`I like creating <a href="/wares/">interactive things</a>,
      meta-creating <a href="/art/">art</a> and writing interactive
      <a href="/notes">blogs</a>! `;
  }

  return html`<blockquote>
    ${introClause}${body}${guestbookClause}${closingClause}
  </blockquote>`;
}

function maybeRenderRss(parent) {
  if (!window.location.pathname.startsWith("/notes/")) return "";

  setTimeout(() => {
    parent
      .querySelector(".rss-link-combo button")
      .addEventListener("click", async (event) => {
        event.preventDefault();
        const href = parent.querySelector(".rss-link-combo a").href;
        try {
          await navigator.clipboard.writeText(href);
          event.target.textContent = "Copied!";
        } catch (e) {}
      });
  });

  return html`
    <aside class="rss-link">
      <p>
        Want me to spam your inbox? Me neither.<br />Forget newsletters; use
        RSS!
      </p>
      <div class="rss-link-combo">
        <a href="/rss.xml" target="_blank"> leanrada.com/rss.xml </a>
        <button>Copy</button>
      </div>
    </aside>
  `;
}

function maybeRenderSuggestions() {
  if (!window.location.pathname.startsWith("/notes/")) return "";
  import("/components/article-suggestions/article-suggestions.js");
  return html`<article-suggestions></article-suggestions>`;
}
