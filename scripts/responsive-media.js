
  (() => {
    const images = document.querySelectorAll("img[spec],img[data-placeholder]");

    for (const img of images) {
      if (watchImage(img)) {
        const intervalID = setInterval(() => watchImage(img, intervalID), 200);
      }
      img.addEventListener("load", onLoadImage, { once: true });
    }

    function watchImage(img, intervalID) {
      if (img.naturalWidth > 0 || img.naturalHeight) {
        img.style.objectPosition = null;
        if (img.hasAttribute("data-placeholder")) {
          img.removeAttribute("width");
          img.removeAttribute("height");
          img.removeAttribute("data-placeholder");
        }

        if (intervalID != undefined) clearInterval(intervalID);
        return false;
      } else {
        if (!img.style.objectPosition) {
          img.style.objectPosition = "100vw";
        }
        return true;
      }
    }

    function onLoadImage(event) {
      event.currentTarget.style.background = null;
    }
  })();
