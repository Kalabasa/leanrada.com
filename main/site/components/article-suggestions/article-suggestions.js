import("/components/feature-card-carousel/feature-card-carousel.js");

customElements.define(
  "article-suggestions",
  class ArticleSuggestions extends HTMLElement {
    constructor() {
      super();

      const placeholder = renderFeatureCard({
        attrs: `class="article-suggestions-placeholder"`,
        href: "#",
        media: "/notes/placeholder.png",
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
            margin: 120px auto 0;
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
        fragment.innerHTML += renderFeatureCard({
          media: suggestion.meta.media ?? "/notes/placeholder.png",
          href: suggestion.meta.href,
          title: suggestion.meta.title,
          description:
            (suggestion.meta.tags ?? [])
              .map((tag) => html`<tag-chip title="${tag}"></tag-chip>`)
              .join(" ") +
            " " +
            renderReason(suggestion.reason),
        });
      }

      const firstCard = carousel.querySelector("feature-card");
      firstCard.replaceWith(fragment.content);
      carousel
        .querySelectorAll(".article-suggestions-placeholder")
        .forEach((el) => el.remove());
    }

    async loadSuggestions() {
      const myHref = window.location.pathname;

      const indexResponse = await fetch("/notes/index.generated.combined.json");
      const index = await indexResponse.json();
      const item = index.find((item) => item.href === myHref);
      return (item?.suggestions ?? []).map((suggestion) => ({
        ...suggestion,
        meta: index.find((item) => item.href === suggestion.href),
      }));
    }
  }
);

function renderFeatureCard({ attrs = "", href, media, title, description }) {
  const mediaElement = media.endsWith(".mp4")
    ? html`<video
        muted
        autoplay
        loop
        playsinline
        src="${media}"
        loading="lazy"
      ></video>`
    : html`<img src="${media}" loading="lazy" />`;

  return html`
    <feature-card ${attrs}>
      <a href="${href}">
        ${mediaElement}
        <hgroup>
          <h1>${title}</h1>
        </hgroup>
        <p>${description}</p>
      </a>
    </feature-card>
  `;
}

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
