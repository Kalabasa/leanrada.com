import("/components/feature-card-carousel/feature-card-carousel.js");
import { renderFeatureCard } from "../feature-card/render-feature-card.js";

customElements.define(
  "article-suggestions",
  class ArticleSuggestions extends HTMLElement {
    constructor() {
      super();

      const placeholder = renderFeatureCard({
        attrs: `class="article-suggestions-placeholder"`,
        href: "#",
        title: "▮▮▮▮▮▮▮▮▮▮▮▮",
        description:
          "▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮",
      });

      this.innerHTML = html`
        <aside>
          <a href="/notes/"><h2>More posts</h2></a>
          <feature-card-carousel>
            ${placeholder} ${placeholder} ${placeholder}
          </feature-card-carousel>
        </aside>
      `;

      appendStyle(
        this.tagName,
        html`<style>
          article-suggestions {
            display: block;
            width: 100%;
            box-sizing: border-box;

            aside > a {
              color: inherit;

              h2 {
                margin: 0 0 30px;
                text-align: center;
              }
            }

            .article-suggestions-placeholder {
              opacity: 0.2;
              filter: grayscale(1);
              pointer-events: none;

              a::after {
                content: none;
              }
            }
          }
        </style>`
      );

      this.#init();
    }

    async #init() {
      const suggestions = await this.loadSuggestions();
      const carousel = this.querySelector("feature-card-carousel");

      const fragment = document.createElement("template");
      for (const suggestion of suggestions) {
        const tagChips = html.raw(
          (suggestion.meta.tags ?? [])
            .map((tag) => html`<tag-chip title="${tag}"></tag-chip>`)
            .join(" ")
        );
        const reason = renderReason(suggestion.reason);
        fragment.innerHTML += renderFeatureCard({
          media: suggestion.meta.media,
          href: suggestion.meta.href,
          title: suggestion.meta.title,
          description: html`${tagChips} ${reason}`,
        });
      }

      const firstCard = carousel.querySelector("feature-card");
      firstCard.replaceWith(fragment.content);
      carousel
        .querySelectorAll(".article-suggestions-placeholder")
        .forEach((el) => el.remove());
    }

    async loadSuggestions() {
      const { loadNotesIndex, loadNote } = await import(
        "/notes/index-loader.js"
      );

      // TODO: Remove else branch when loadNote has propagated
      if (loadNote) {
        const result = await loadNote(window.location.pathname);
        if (!result) return [];
        return result.note.suggestions.map((suggestion) => ({
          ...suggestion,
          meta: result.index.find((item) => item.href === suggestion.href),
        }));
      } else {
        const index = await loadNotesIndex();
        const myHref = window.location.pathname;
        const note = index.find((item) => item.href === myHref);
        return (note?.suggestions ?? []).map((suggestion) => ({
          ...suggestion,
          meta: index.find((item) => item.href === suggestion.href),
        }));
      }
    }
  }
);

function renderReason(reason) {
  switch (reason) {
    case "ref":
      return "Linked with this post";
    case "tag":
      return "Based on common tags";
    case "next":
      return "Next post";
    default:
      return "";
  }
}
