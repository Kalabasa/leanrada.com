let x = 0;
let y = 0;

if (document.readyState == 'loading') {
  document.addEventListener(
    "DOMContentLoaded",
    init,
    { once: true }
  );
} else {
  init();
}

function init() {
  document.body.addEventListener("pointerdown", (event) => {
    x = event.clientX;
    y = event.clientY;
  });
  document.body.addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;
  });
  document.body.addEventListener("mousemove", (event) => {
    x = event.clientX;
    y = event.clientY;
  });
}

export const mousePosition = {
  get x() {
    return x;
  },
  get y() {
    return y;
  }
};
