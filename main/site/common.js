customElements.define(
  "site-header",
  class SiteHeader extends HTMLElement {
    #currentY = 0;
    #currentYTarget = 0;
    #mouseHovering = false;
    #isTouch = false;
    #lastScrollY = window.scrollY;
    #lastCursorY = 0;

    constructor() {
      super();
    }

    connectedCallback() {
      const isSelected = (href) =>
        href === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(href);

      const renderItem = (href, label) => html`<a
        href="${href}"
        class="${isSelected(href) ? "selected" : ""}"
        >${label}</a
      >`;

      const iconsrc = this.getAttribute("iconsrc");

      this.innerHTML = html`<nav>
        ${renderItem("/", "Home")} ${renderItem("/notes/", "Notes")}
        ${renderItem("/about/", "About")}
        <img
          class="${iconsrc ? "" : "site-header-icon-yay"}"
          src="${iconsrc || "/icons/yay_sheet.png"}"
          alt=""
        />
        ${renderItem("/wares/", "Wares")} ${renderItem("/art/", "Art")}
        ${renderItem("/music/", "Music")}
        <div class="site-header-indicator"></div>
      </nav>`;

      const passive = { passive: true };
      window.addEventListener("scroll", debounce(this.#onScroll), passive);
      window.addEventListener(
        "mousemove",
        debounce(this.#onMouseMove, 100),
        passive
      );
      window.addEventListener("touchstart", this.#onWindowTouchStart, passive);
      window.addEventListener("touchmove", this.#onWindowTouchMove, passive);
      this.addEventListener("touchstart", this.#onTouchStart, passive);

      if (this.getAttribute("prehide")) {
        this.#currentY = this.#currentYTarget = -this.offsetHeight;
        this.#updateDOM();
      }
    }

    #onScroll = (event) => {
      const dy = window.scrollY - this.#lastScrollY;

      // move with the page
      this.#currentY -= dy;
      if (this.#currentY > 0) {
        this.#currentY = 0;
      } else if (this.#currentY < -this.offsetHeight) {
        this.#currentY = -this.offsetHeight;
      }

      this.#currentYTarget = this.#currentY;
      this.#updateDOM();

      this.#lastScrollY = window.scrollY;
    };

    #onMouseMove = (event) => {
      if (this.#isTouch) return;

      const dy = event.clientY - this.#lastCursorY;

      // show when mouse goes near the top
      const scaledDy = Math.sign(dy) * Math.log1p(Math.abs(dy)) * 20;
      if (dy < 0 && event.clientY + scaledDy < this.offsetHeight) {
        this.#currentYTarget = 0;
        this.#mouseHovering = true;
      } else if (
        this.#mouseHovering &&
        dy > 0 &&
        event.clientY > this.offsetHeight * 4
      ) {
        this.#currentYTarget = Math.max(-window.scrollY, -this.offsetHeight);
        this.#mouseHovering = false;
      }

      this.#updateDOM();
      this.#lastCursorY = event.clientY;
    };

    #onWindowTouchStart = (event) => {
      this.#isTouch = true;
      this.#lastCursorY = event.touches[0].clientY;
    };

    #onWindowTouchMove = (event) => {
      const dy = event.touches[0].clientY - this.#lastCursorY;

      // move with touch but only if at edge
      if (window.scrollY <= 0 && dy > 0) {
        this.#currentY += dy;
        if (this.#currentY >= 0) {
          this.#currentY = 0;
          document.body.style.overscrollBehaviorY = null;
        } else if (this.#currentY < 0) {
          document.body.style.overscrollBehaviorY = "none";
        }

        this.#currentYTarget = this.#currentY;
        this.#updateDOM();
      }

      this.#lastCursorY = event.touches[0].clientY;
    };

    #onTouchStart(event) {
      this.#currentYTarget = 0;
      this.#updateDOM();
    }

    #updateDOM = debounce(() => {
      this.style.transform = `translateY(${this.#currentY.toFixed(2)}px)`;

      const isHidden = this.#currentY < -this.offsetHeight * 0.8;
      this.classList.toggle("hidden", isHidden);

      if (Math.abs(this.#currentY - this.#currentYTarget) > 1) {
        this.#currentY += (this.#currentYTarget - this.#currentY) * 0.2;
        requestAnimationFrame(this.#updateDOM);
      } else {
        this.#currentY = this.#currentYTarget;
      }
    });
  }
);

customElements.define(
  "site-footer",
  class SiteFooter extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      import("/components/nebula-animation/nebula-animation.js");

      const geekringNumber = 288;

      this.innerHTML = html`<footer>
        <div>
          <p>
            <a href="/">Home</a> · <a href="/notes/">Notes</a> ·
            <a href="/about/">About</a> · <a href="/wares/">Software</a> ·
            <a href="/art/">Art</a> ·
            <a href="/music/">Music</a>
          </p>
          <p>
            <img
              class="lg-icon pixelated"
              alt=""
              src="/icons/laptop_user.png"
              loading="lazy"
              style="vertical-align: top"
            />
            <span style="display: inline-block">
              ·
              <a href="/guestbook/">Sign the guestbook!</a>
              <br />
              · Drop a
              <a
                href="&#109;&#97;&#105;&#108;&#116;&#111;&#58;mail%40leanrada.com"
                target="_blank"
              >
                mail＠leanrada·com
              </a>
              <br />
            </span>
          </p>
          <p>This site is best viewed with a cup of hot chocolate.</p>
          <p>
            (C) 2015-${new Date().getFullYear()} Lean Rada.
            <a href="https://github.com/Kalabasa/leanrada.com" target="_blank">
              Source</a
            >.
          </p>
        </div>
        <div>
          <h2>On the web</h2>
          <a
            class="no-text-decoration"
            href="https://mastodon.social/@Kalabasa"
            target="_blank"
            rel="me"
          >
            <img
              class="md-icon pixelated invert-on-hover"
              alt="Mastodon"
              src="/icons/mastodon.png"
              loading="lazy"
            />
          </a>
          <a
            class="no-text-decoration"
            href="https://codepen.io/kalabasa"
            target="_blank"
          >
            <img
              class="md-icon pixelated invert-on-hover"
              alt="CodePen"
              src="/icons/codepen.png"
              loading="lazy"
            />
          </a>
          <a
            class="no-text-decoration"
            href="https://github.com/Kalabasa"
            target="_blank"
            rel="me"
          >
            <img
              class="md-icon pixelated invert-on-hover"
              alt="GitHub"
              src="/icons/github.png"
              loading="lazy"
            />
          </a>
          <h2>Webrings</h2>
          <p>
            <img
              class="sm-icon pixelated"
              alt=""
              src="/icons/planet.png"
              loading="lazy"
            />
            <a href="http://geekring.net/" target="_blank">geekring.net</a>
            [<a
              href="http://geekring.net/site/${geekringNumber}/previous"
              target="_blank"
              aria-label="Previous site"
              >←</a
            >
            <a
              href="http://geekring.net/site/${geekringNumber}/random"
              target="_blank"
              aria-label="Random site"
              >⁙</a
            >
            <a
              href="http://geekring.net/site/${geekringNumber}/next"
              target="_blank"
              aria-label="Next site"
              >→</a
            >
            <a
              href="http://geekring.net/site/${geekringNumber}/frameset"
              target="_blank"
              aria-label="Frameset browsing"
              >▣</a
            >]
          </p>
          <p>
            <img
              class="sm-icon pixelated"
              alt=""
              src="/icons/planet.png"
              loading="lazy"
            />
            <a href="https://cs.sjoy.lol/">CSS JOY</a>
            [<a
              href="https://webri.ng/webring/cssjoy/previous?via=https%3A%2F%2Fleanrada.com"
              target="_blank"
              aria-label="Previous site"
              >←</a
            >
            <a
              href="https://webri.ng/webring/cssjoy/random?via=https%3A%2F%2Fleanrada.com"
              target="_blank"
              aria-label="Random site"
              >⁙</a
            >
            <a
              href="https://webri.ng/webring/cssjoy/next?via=https%3A%2F%2Fleanrada.com"
              target="_blank"
              aria-label="Next site"
              >→</a
            >]
          </p>
        </div>
        <nebula-animation
        mouse
          palette="#0ad591 #ff2b75 #ffb833 #0ad591 #0ad591 #4d4aff #0ad591"
          width="40"
          height="10"
        ></nebula-animation>
        <a href="#top" aria-label="Back to top">^</a>
      </footer>`;

      const topBtn = this.querySelector("a[href='#top']");
      topBtn.addEventListener("click", (event) => {
        event.preventDefault();
        this.#animateScrollToTop();
      });

      if (this.parentElement === document.body) {
        this.#updatePosition();
        window.addEventListener("resize", () => {
          this.#updatePosition();
        });
      }
    }

    #animateScrollToTop(currentY = Math.min(800, window.scrollY)) {
      currentY *= 0.6;
      window.scrollTo(0, currentY);
      if (currentY < 1) {
        window.scrollTo(0, 0);
      } else {
        requestAnimationFrame(() => this.#animateScrollToTop(currentY));
      }
    }

    // why not flex? I wanted <body> to be as vanilla as possible
    #updatePosition() {
      const originalTop =
        this.offsetTop - (this.style.top ? Number.parseInt(this.style.top) : 0);
      const goodTop = window.innerHeight - this.offsetHeight - originalTop;
      if (goodTop > 0) {
        this.style.position = "relative";
        this.style.top = goodTop + "px";
      } else {
        this.style.removeProperty("position");
        this.style.removeProperty("bottom");
      }
    }
  }
);

function html(strings, ...values) {
  return String.raw({ raw: strings }, ...values);
}

const appendedStyles = new Set();
function appendStyle(id, htmlCode) {
  if (appendedStyles.has(id)) return;
  const styleElement = document.createElement("style");
  styleElement.innerText = htmlCode
    .slice("<style>".length, -"</style>".length)
    .replace(/\s+/g, " ");
  document.head.appendChild(styleElement);
}

function debounce(fn, ms = 0) {
  let recentlyFired = false;
  return (...args) => {
    if (recentlyFired) return;
    recentlyFired = true;
    if (ms === 0) {
      requestAnimationFrame(() => (recentlyFired = false));
    } else {
      setTimeout(() => (recentlyFired = false), ms);
    }
    return fn(...args);
  };
}
