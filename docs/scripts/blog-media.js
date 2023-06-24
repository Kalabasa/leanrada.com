
  (() => {
    const blogMediaElementImages = document.querySelectorAll(
      "img.blog-media-element"
    );

    for (const img of blogMediaElementImages) {
      if (watchImage(img)) {
        const intervalID = setInterval(() => watchImage(img, intervalID), 200);
      }
      img.addEventListener("load", onLoadImage);
    }

    function watchImage(img, intervalID) {
      if (img.naturalWidth > 0 || img.naturalHeight) {
        img.style.objectPosition = null;
        img.removeAttribute("width");
        img.removeAttribute("height");

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
