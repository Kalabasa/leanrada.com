
  (() => {
    const iframe = document.querySelector(".archive-iframe");
    iframe.addEventListener("load", () => {
      updateTitle();
      new MutationObserver(updateTitle).observe(
        iframe.contentDocument.querySelector("head"),
        {
          subtree: true,
          characterData: true,
          childList: true,
        }
      );
    });

    function updateTitle() {
      const title = iframe.contentDocument.title;
      document.title = `Archive · ${title} · leanrada.com`;
    }
  })();
