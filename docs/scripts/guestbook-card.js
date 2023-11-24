
  import { BaseElement } from "/lib/base_element.mjs";

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
  placeholder="${disabled ? "" : "Your name"}"
  ${disabled ? "disabled" : ""}
/>
`;

        this.bodyInput = this.asyncQuerySelector(".guestbook-card-body");
        this.nameInput = this.asyncQuerySelector(".guestbook-card-name");

        if (data?.text) {
          this.bodyInput.promise.then((input) => (input.value = data.text));
        }
        if (data?.name) {
          this.nameInput.promise.then((input) => (input.value = data.name));
        }

        const { getDefaults, getCSS } = await loadGuestbookCardLib();
        this.currentStyle = data?.style ?? getDefaults();
        this.setAttribute("style", getCSS(this.currentStyle));
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
