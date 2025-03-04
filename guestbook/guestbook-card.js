export const BG_COLORS = [
  0xffccdd, 0xffffcc, 0xddffcc, 0xccffff, 0xddccff, 0xffffff,
];
export const FG_COLORS = [0xcc0000, 0xaa6600, 0x00aa00, 0x0066ff, 0x000000];
export const STAMPS = "💾,🔖,🕶,🧬,📌,🎃,🎀,👾,🐚,🔱,➰".split(",");
const MAX_STAMPS = 4;

const defaults = getDefaults();

export function getDefaults() {
  return {
    bgRGB: 0xffffff,
    fgRGB: 0x000000,
    bgStyleIndex: 0,
    fontIndex: 0,
  };
}

export function createGuestbookCard(data) {
  if (typeof module === "object") {
    // node
    const text = encodeHtmlAttribute(data.text);
    const name = encodeHtmlAttribute(data.name);
    const stamps = encodeHtmlAttribute(JSON.stringify(data.stamps));
    const style = encodeHtmlAttribute(JSON.stringify(data.style));
    return `<guestbook-card
      data-text="${text}"
      data-name="${name}"
      data-stamps-json="${stamps}"
      data-style-json="${style}"
    ></guestbook-card>`;
  } else {
    // web
    const card = document.createElement("guestbook-card");
    card.toggleAttribute("disabled", true);
    card.setAttribute("data-text", data.text);
    card.setAttribute("data-name", data.name);
    card.setAttribute("data-stamps-json", JSON.stringify(data.stamps));
    card.setAttribute("data-style-json", JSON.stringify(data.style));
    return card;
  }
}

function encodeHtmlAttribute(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/[&<>"']/g, (match) => {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return match;
    }
  });
}

function getCSS({
  bgRGB = defaults.bgRGB,
  fgRGB = defaults.fgRGB,
  bgStyleIndex = defaults.bgStyleIndex,
  fontIndex = defaults.fontIndex,
}) {
  return formatStyle({
    "--gbc-font": getFont(fontIndex),
    "--gbc-background-image": formatBgImageSize(bgStyleIndex),
    "--gbc-background-color": rgbToCSS(bgRGB),
    "--gbc-color": rgbToCSS(fgRGB),
  });
}

function getFont(fontIndex) {
  if (fontIndex === /* sans-serif */ 0) {
    return "'Helvetica', 'Arial', sans-serif";
  } else if (fontIndex === /* serif */ 1) {
    return "'Times', 'Times New Roman', serif";
  } else if (fontIndex === /* mono */ 2) {
    return "'Courier New', 'Courier', monospace";
  }
  return "";
}

export function getStampContent(stampTypeIndex) {
  return STAMPS[stampTypeIndex % STAMPS.length];
}

function formatBgImageSize(bgStyleIndex) {
  if (bgStyleIndex === /* solid */ 0) {
    return "none";
  } else if (bgStyleIndex === /* hlines */ 1) {
    return "linear-gradient(0deg, #00002211 2px, #ffffdd22 2px) top / 1px 30px";
  } else if (bgStyleIndex === /* dlines */ 2) {
    return "linear-gradient(135deg, #00002206 25%, #ffffdd22 25%, #ffffdd22 50%, #00002206 50%, #00002206 75%, #ffffdd22 75%) top / 60px 60px";
  } else if (bgStyleIndex === /* grid */ 3) {
    return "linear-gradient(0deg, #00002211 2px, #ffffdd22 2px) top / 20px 20px, linear-gradient(90deg, #00002211 2px, #ffffdd22 2px) top / 20px 20px";
  }
  return "";
}

function formatStyle(styleObj) {
  return Object.entries(styleObj)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}

function rgbToCSS(rgb) {
  return "#" + Number(rgb).toString(16).padStart(6, "0");
}

globalThis.customElements?.define(
  "guestbook-card",
  class GuestbookCard extends HTMLElement {
    static observedAttributes = [
      "disabled",
      "data-text",
      "data-name",
      "data-stamps-json",
      "data-style-json",
    ];

    get textInput() {
      return this.querySelector(":scope > textarea");
    }

    get nameInput() {
      return this.querySelector(":scope > input");
    }

    get stampContainer() {
      return this.querySelector(":scope > div");
    }

    get stamps() {
      try {
        return JSON.parse(this.dataset.stampsJson);
      } catch (error) {
        return [];
      }
    }

    set stamps(value) {
      if (!Array.isArray(value)) throw new TypeError();
      if (value[0].typeIndex == undefined) throw new TypeError();
      if (value[0].x == undefined) throw new TypeError();
      if (value[0].y == undefined) throw new TypeError();
      this.setAttribute("data-stamps-json", JSON.stringify(value));
    }

    get cardStyle() {
      try {
        return JSON.parse(this.dataset.styleJson);
      } catch (error) {
        return getDefaults();
      }
    }

    set cardStyle(value) {
      if (typeof value !== "object") throw new TypeError();
      this.setAttribute("data-style-json", JSON.stringify(value));
    }

    connectedCallback() {
      if (!this.textInput) {
        const newTextInput = document.createElement("textarea");
        newTextInput.name = "text";
        newTextInput.required = true;
        newTextInput.disabled = this.hasAttribute("disabled");
        newTextInput.value = this.dataset.text ?? "";
        this.prepend(newTextInput);
      }

      if (!this.nameInput) {
        const newNameInput = document.createElement("input");
        newNameInput.name = "name";
        newNameInput.disabled = this.hasAttribute("disabled");
        newNameInput.value = this.dataset.name ?? "";
        this.append(newNameInput);
      }

      if (!this.stampContainer) {
        const newStampContainer = document.createElement("div");
        this.append(newStampContainer);
        this.#renderStamps();
      }

      this.#renderStyle();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case "disabled":
          if (this.textInput) this.textInput.disabled = newValue != null;
          if (this.nameInput) this.nameInput.disabled = newValue != null;
          return;
        case "data-text":
          if (this.textInput) this.textInput.value = newValue;
          return;
        case "data-name":
          if (this.nameInput) this.nameInput.value = newValue;
          return;
        case "data-stamps-json":
          this.#renderStamps();
          return;
        case "data-style-json":
          this.#renderStyle();
          return;
      }
    }

    #renderStamps() {
      this.stampContainer?.replaceChildren(
        ...this.stamps.slice(-MAX_STAMPS).map((stamp) => {
          const content = getStampContent(stamp.typeIndex);

          const stampElement = document.createElement("div");
          stampElement.innerHTML =
            content +
            `<input name="stampTypes" type="hidden" value="${Number(
              stamp.typeIndex
            )}">` +
            `<input name="stampXs" type="hidden" value="${Number(stamp.x)}">` +
            `<input name="stampYs" type="hidden" value="${Number(stamp.y)}">`;

          stampElement.style.left = `${Number(stamp.x)}%`;
          stampElement.style.top = `${Number(stamp.y)}%`;

          return stampElement;
        })
      );
    }

    #renderStyle() {
      this.setAttribute("style", getCSS(this.cardStyle));
    }

    addStamp(typeIndex, x, y) {
      this.stamps = [...this.stamps, { typeIndex, x, y }];
    }

    updateStyle(style) {
      const newStyle = { ...this.cardStyle, ...style };
      this.cardStyle = newStyle;
      return getCSS(newStyle);
    }
  }
);
