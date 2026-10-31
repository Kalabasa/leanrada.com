export function throttle(func, delay) {
  let throttled = false;
  return (...args) => {
    if (!throttled) {
      throttled = true;
      setTimeout(() => {
        func(...args);
        throttled = false;
      }, delay);
    }
  };
}
