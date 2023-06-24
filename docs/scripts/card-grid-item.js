
  (() => {
    const items = document.querySelectorAll(".card-grid-item");
    for (const item of items) {
      const info = item.querySelector(".card-grid-info");
      info.addEventListener("click", (event) => {
        console.log(event);
        event.preventDefault();
        item.classList.add("card-grid-item-expanded");
      });
    }
  })();
