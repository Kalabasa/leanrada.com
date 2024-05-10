
  (() => {
    document.querySelector(".thisperson").addEventListener("click", (event) => {
      const { currentTarget } = event;
      currentTarget.src = "./plant.gif";
      currentTarget.addEventListener(
        "load",
        () => (currentTarget.src = "https://www.thispersondoesnotexist.com"),
        { once: true }
      );
    });
  })();
