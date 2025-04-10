customElements.define(
  "now-playing",
  class NowPlaying extends HTMLElement {
    #href = null;
    #isPlayingNow = false;

    constructor() {
      super();

      this.innerHTML = html`
        <a target="_blank" rel="noopener">
          <img src="/components/now-playing/placeholder.png" alt="" />
          <span>now playing</span>
          <span>loading&hellip;</span>
        </a>
      `;

      appendStyle(
        this.tagName,
        html`<style>
          now-playing {
            display: contents;
            font-style: normal;
            font-weight: bold;
            container-type: inline-size;

            a {
              width: 100%;
              max-width: 300px;
              display: grid;
              grid-template-columns: 1fr 2fr;
              grid-template-rows: auto auto;
              gap: 12px 18px;
              align-content: center;
              text-decoration: none;
              color: var(--text-clr);

              &:hover {
                color: var(--clr0-light);
              }
            }

            img {
              width: 100%;
              height: auto;
              aspect-ratio: 1 / 1;
              object-fit: cover;
              border-radius: 6px;
              grid-row: span 2;
              image-rendering: pixelated;
              background-color: var(--card-clr);
            }

            span:first-of-type,
            summary {
              font-size: 93.75%;
              font-style: italic;
              color: var(--text2-clr);
              align-self: end;
              text-wrap: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            span:last-of-type {
              font-weight: normal;
              text-wrap: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            em::before {
              content: "";
              display: inline-block;
              width: 15px;
              height: 15px;
              margin-inline-end: 6px;
              background-image: linear-gradient(
                  to bottom,
                  var(--clr0),
                  var(--clr0-dark)
                ),
                linear-gradient(to bottom, var(--clr0), var(--clr0-dark)),
                linear-gradient(to bottom, var(--clr0), var(--clr0-dark));
              background-position: 0% 100%, 33% 100%, 66% 100%;
              background-size: 33% 50%, 33% 50%, 33% 50%;
              background-repeat: no-repeat;
              animation: now-playing-bars 1s cubic-bezier(0.37, 0, 0.63, 1)
                infinite;
            }

            details {
              display: flex;
              flex-direction: column;
              gap: 12px;

              summary {
                pointer-events: none;
                align-self: start;
              }
            }
          }

          @keyframes now-playing-bars {
            0%,
            100% {
              background-size: 33% 3%, 33% 7%, 33% 87%;
            }
            10% {
              background-size: 33% 8%, 33% 23%, 33% 93%;
            }
            20% {
              background-size: 33% 73%, 33% 65%, 33% 16%;
            }
            30% {
              background-size: 33% 97%, 33% 54%, 33% 37%;
            }
            40% {
              background-size: 33% 79%, 33% 47%, 33% 82%;
            }
            50% {
              background-size: 33% 48%, 33% 48%, 33% 82%;
            }
            60% {
              background-size: 33% 6%, 33% 59%, 33% 68%;
            }
            70% {
              background-size: 33% 35%, 33% 86%, 33% 8%;
            }
            80% {
              background-size: 33% 65%, 33% 88%, 33% 21%;
            }
            90% {
              background-size: 33% 86%, 33% 71%, 33% 59%;
            }
          }
        </style>`
      );
    }

    connectedCallback() {
      const intersectionObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) init();
      });
      intersectionObserver.observe(this.querySelector("img"));

      const init = () => {
        intersectionObserver.disconnect();
        const [status, title] = this.querySelectorAll("span");
        fetch("https://now-playing.leanrada.com/api")
          .then((res) => res.json())
          .then(({ name, imageURL, href, isPlayingNow }) => {
            this.#isPlayingNow = isPlayingNow;
            if (!href) throw new Error("None playing");
            this.#href = href;
            this.querySelector("a").href = href;
            this.querySelector("img").src = imageURL;
            status.innerHTML = getStatusHTML(isPlayingNow);
            title.textContent = name;
          })
          .catch(() => {
            title.textContent = "none";
          });
      };

      this.addEventListener("click", (event) => {
        if (!this.#href) return;
        if (this.querySelector("a").offsetWidth < 250) return;
        event.preventDefault();
        this.#convertToEmbed(this.#href);
      });
    }

    #convertToEmbed(href) {
      const src = href.replace("/track", "/embed/track");
      this.innerHTML = html`<details disabled open>
        <summary tabindex="-1">${getStatusHTML(this.#isPlayingNow)}</summary>
        <iframe
          src="${src}"
          width="100%"
          height="80"
          scrolling="no"
          frameborder="0"
          style="border-radius:18px;overflow:hidden"
        ></iframe>
      </details>`;
    }
  }
);

function getStatusHTML(isPlayingNow) {
  return isPlayingNow ? html`<em>now playing</em>` : "last played";
}
