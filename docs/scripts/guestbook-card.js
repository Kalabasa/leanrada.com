
  import { BaseElement } from "/lib/base_element.mjs";

  const MAX_STAMPS = 4;

  customElements.define(
    "guestbook-card-client",
    class GuestbookCard extends BaseElement {
      constructor() {
        super();

        this.visibilityListener({
          show: () => this.init(),
        });
      }

      async init() {
        if (this.hasInit) return;
        this.hasInit = true;

        const disabled = this.hasAttribute("disabled");
        const dataAttr = this.getAttribute("data");
        const data = dataAttr ? JSON.parse(dataAttr) : null;

        this.innerHTML = `
  <textarea
    class="guestbook-card-body"
    name="text"
    placeholder="${disabled ? "" : "Your message"}"
    ${disabled ? "disabled" : ""}
    required
  ></textarea>
  <input
    class="guestbook-card-name"
    name="name"
    type="text"
    placeholder="${disabled ? "" : "Name / pseudonym"}"
    ${disabled ? "disabled" : ""}
  />
  <div class="guestbook-card-stamp-container"></div>
  `;

        this.bodyInput = this.asyncQuerySelector(".guestbook-card-body");
        this.nameInput = this.asyncQuerySelector(".guestbook-card-name");
        this.stampContainer = this.asyncQuerySelector(
          ".guestbook-card-stamp-container"
        );

        if (data?.text) {
          this.bodyInput.promise.then((input) => (input.value = data.text));
        }
        if (data?.name) {
          this.nameInput.promise.then((input) => (input.value = data.name));
        }

        for (const stamp of data?.stamps ?? []) {
          this.addStamp(stamp.typeIndex, stamp.x, stamp.y);
        }

        const { getDefaults, getCSS } = await loadGuestbookCardLib();
        this.currentStyle = data?.style ?? getDefaults();
        this.setAttribute("style", getCSS(this.currentStyle));
      }

      async addStamp(typeIndex, x, y) {
        const [stampContainer, { getStampContent }] = await Promise.all([
          this.stampContainer.promise,
          loadGuestbookCardLib(),
        ]);

        const content = getStampContent(typeIndex);

        const stampElement = document.createElement("div");
        stampElement.innerHTML =
          content +
          `<input name="stampTypes" type="hidden" value="${typeIndex}">` +
          `<input name="stampXs" type="hidden" value="${x}">` +
          `<input name="stampYs" type="hidden" value="${y}">`;

        stampElement.classList.add("guestbook-card-stamp");

        stampElement.style.left = `${x}%`;
        stampElement.style.top = `${y}%`;

        stampContainer.appendChild(stampElement);
        while (stampContainer.childElementCount > MAX_STAMPS) {
          stampContainer.firstElementChild.remove();
        }
      }

      async updateStyle(style) {
        const { getCSS } = await loadGuestbookCardLib();
        Object.assign(this.currentStyle, style);
        this.setAttribute("style", getCSS(this.currentStyle));
        return this.currentStyle;
      }
    }
  );

  async function loadGuestbookCardLib() {
    return (loadGuestbookCardLib.result =
      loadGuestbookCardLib.result ??
      import("/guestbook/guestbook-card.js").then(() => window.GUESTBOOK_CARD));
  }
