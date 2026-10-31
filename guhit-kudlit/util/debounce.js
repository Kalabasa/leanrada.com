export function debounce(func, delay) {
  let timeoutID;
  return (...args) => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => func(...args), delay);
  };
}
