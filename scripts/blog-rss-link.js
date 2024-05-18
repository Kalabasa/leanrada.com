
  (() => {
    for (const button of document.querySelectorAll(".blog-rss-link-button")) {
      button.addEventListener("click", (e) => {
        const copied = copy();
        if (copied) button.textContent = "Copied";
      });
    }

    async function copy() {
      const href = document.querySelector(".blog-rss-link-a").href;
      try {
        await navigator.clipboard.writeText(href);
        return true;
      } catch (e) {}
      return false;
    }
  })();
