class SongCard extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const src = this.getAttribute("src");
    const title = this.getAttribute("title");
    const description = this.getAttribute("description");

    this.innerHTML = html`
      <button class="song-card-play" aria-label="Play / Pause"></button>
      <audio src="${src}" controls preload="metadata"></audio>
      <div class="song-card-title">${title} ${this.#maybeRenderTag()}</div>
      <div class="song-card-description">${description}</div>
    `;

    appendStyle(
      this.tagName,
      html`<style>
        song-card {
          display: grid;
          grid-template-columns: min-content 18px 1fr;
          grid-template-rows: min-content min-content;
          grid-template-areas:
            "play . title"
            "play . description";
          border: solid 1px var(--card-clr);
          border-radius: 12px;
          padding: 12px;
          min-height: 84px;
          box-sizing: border-box;
          background-color: var(--bg-clr);
          background-image: linear-gradient(
            to right,
            var(--card-clr) var(--song-card-progress),
            transparent var(--song-card-progress)
          );
        }
        song-card.song-card-playing {
          background-image: linear-gradient(
            to right,
            var(--clr0-dark) var(--song-card-progress),
            transparent var(--song-card-progress)
          );
        }

        song-card button {
          display: flex;
          justify-content: center;
          align-items: center;
          grid-area: play;
          border: solid 1px var(--card-clr);
          border-radius: 50%;
          padding: 0;
          width: 60px;
          height: 60px;
          box-sizing: border-box;
          background: var(--bg-clr);
          cursor: pointer;
        }
        song-card button:focus-visible,
        song-card button:hover {
          background: var(--clr0-dark);
        }
        song-card.song-card-playing button {
          background: var(--clr0-dark);
          animation: songCardPlayingPlayButton 1s linear infinite;
        }
        song-card.song-card-playing button:focus-visible,
        song-card.song-card-playing button:hover {
          background: var(--bg-clr);
        }
        song-card button:active,
        song-card.song-card-playing button:active {
          background: var(--clr0-light);
        }

        song-card button::after {
          content: "";
          margin-left: 16px;
          border: solid 12px transparent;
          border-left-color: var(--text-clr);
          width: 24px;
          height: 24px;
          box-sizing: border-box;
        }
        song-card.song-card-playing button::after {
          content: "💿";
          margin: 0;
          border: none;
          width: auto;
          height: auto;
          font-size: 30px;
          line-height: 30px;
          filter: brightness(0.65) contrast(9);
        }
        @keyframes songCardPlayingPlayButton {
          to {
            transform: rotate(1turn);
          }
        }

        .song-card-title {
          grid-area: title;
          font-family: var(--display-font);
          font-size: 18px;
          font-style: italic;
        }

        .song-card-description {
          grid-area: description;
          font-family: var(--display-font);
          font-size: 15px;
          font-style: italic;
          font-weight: bold;
          opacity: 0.4;
        }

        song-card audio {
          grid-area: play;
          max-width: 180px;
        }
      </style>`
    );

    let isPlaying = false;

    const audio = this.querySelector("audio");
    audio.style.display = "none";
    audio.addEventListener("timeupdate", () => {
      const progress = audio.currentTime / audio.duration;
      this.style.setProperty(
        "--song-card-progress",
        Math.round(progress * 10_000) / 100 + "%"
      );
    });
    audio.addEventListener("ended", () => {
      isPlaying = false;
      SongCard.stopCurrentlyPlaying = () => {};
      this.classList.toggle("song-card-playing", isPlaying);
    });

    const button = this.querySelector("button");
    button.addEventListener("click", () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        audio.play();
        SongCard.stopCurrentlyPlaying();
        SongCard.stopCurrentlyPlaying = () => {
          audio.pause();
          isPlaying = false;
          this.classList.toggle("song-card-playing", isPlaying);
        };
      } else {
        audio.pause();
        SongCard.stopCurrentlyPlaying = () => {};
      }

      this.classList.toggle("song-card-playing", isPlaying);
    });
  }

  #maybeRenderTag() {
    const tag = this.getAttribute("tag");
    if (!tag) return "";
    return html`<tag-chip title="${tag}"></tag-chip>`;
  }
}

SongCard.stopCurrentlyPlaying = () => {};

customElements.define("song-card", SongCard);
