
  (() => {
    const containers = document.querySelectorAll(".card-carousel-container");

    for (const container of containers) {
      const carousel = container.firstElementChild;

      container.addEventListener(
        "click",
        (event) => {
          const { target } = event;

          const isButton = target.classList.contains("card-carousel-btn");
          if (!isButton) return;

          const isNext = target.classList.contains("card-carousel-btn-next");
          const stepUnitSize =
            carousel.children[1]?.offsetLeft - carousel.children[0]?.offsetLeft;
          const delta =
            (isNext ? 1 : -1) *
            Math.max(1, Math.floor(carousel.offsetWidth / stepUnitSize)) *
            stepUnitSize;
          carousel.scrollBy({
            left: delta,
            behavior: "smooth",
          });

          updateButtons(container, delta);
        },
        { capture: true }
      );

      let debouncedScrollTimeout = null;
      carousel.addEventListener(
        "scroll",
        () => {
          if (debouncedScrollTimeout) clearTimeout(debouncedScrollTimeout);
          debouncedScrollTimeout = setTimeout(() => {
            updateButtons(container);
          }, 50);
        },
        { passive: true }
      );

      updateButtons(container);
    }

    function updateButtons(container, delta = 0) {
      const carousel = container.firstElementChild;
      const nextButton = container.querySelector(".card-carousel-btn-next");
      const prevButton = container.querySelector(".card-carousel-btn-prev");
      nextButton.classList.toggle(
        "card-carousel-btn-hidden",
        carousel.scrollLeft + delta >
          carousel.scrollWidth - carousel.offsetWidth - 60
      );
      prevButton.classList.toggle(
        "card-carousel-btn-hidden",
        carousel.scrollLeft + delta < 60
      );
    }
  })();
