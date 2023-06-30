export const mousePosition = (() => {
  const mousePosition = { x: 0, y: 0 };

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      document.body.addEventListener("pointerdown", (event) => {
        mousePosition.x = event.clientX;
        mousePosition.y = event.clientY;
      });
      document.body.addEventListener("mousemove", (event) => {
        mousePosition.x = event.clientX;
        mousePosition.y = event.clientY;
      });
    },
    { once: true }
  );

  return mousePosition;
})();
