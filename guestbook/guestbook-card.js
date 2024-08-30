(function (factory) {
  if (typeof module === "object") {
    // node
    module.exports = factory();
  } else {
    // browser
    window.GUESTBOOK_CARD = factory();
  }
})(function () {
  const BG_COLORS = [
    0xffccdd, 0xffffcc, 0xddffcc, 0xccffff, 0xddccff, 0xffffff,
  ];
  const FG_COLORS = [0xcc0000, 0xaa6600, 0x00aa00, 0x0066ff, 0x000000];
  const STAMPS = "💾,🔖,🕶,🧬,📌,🎃,🎀,👾,🐚,🔱,➰".split(",");

  const defaults = getDefaults();

  function getDefaults() {
    return {
      bgRGB: 0xffffff,
      fgRGB: 0x000000,
      bgStyleIndex: 0,
      fontIndex: 0,
    };
  }

  function createGuestbookCard(data, html = concat) {
    if (typeof module === "object") {
      // node
      const dataStr = encodeHtmlAttribute(JSON.stringify(data));
      return html`<guestbook-card-client
        disabled
        data="${dataStr}"
      ></guestbook-card-client>`;
    } else {
      // web
      const card = document.createElement("guestbook-card-client");
      card.setAttribute("disabled", "");
      card.setAttribute("data", JSON.stringify(data));
      return card;
    }
  }

  function concat(strings, ...values) {
    let result = "";
    strings.forEach((string, i) => {
      result += string + (values[i] || "");
    });
    return result;
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

  function getStampContent(stampTypeIndex) {
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

  return {
    BG_COLORS,
    FG_COLORS,
    STAMPS,
    getDefaults,
    getCSS,
    getStampContent,
    createGuestbookCard,
  };
});
