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
      const html = (strings, ...values) =>
        String.raw({ raw: strings }, ...values);

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
