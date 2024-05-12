export function waitFor(condition) {
  if (condition()) return Promise.resolve();

  return new Promise((resolve) => {
    wait();
    function wait() {
      if (condition()) resolve();
      else setTimeout(wait, 200);
    }
  });
};
