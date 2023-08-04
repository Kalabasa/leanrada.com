export function createInsertionSort(callbacks) {
  const { onCompare, onSwap } = callbacks;

  async function compare(a, b) {
    await onCompare?.(a, b);
    return a.x - b.x;
  }

  return async function insertionSort(arr, start = 1, end = arr.length) {
    for (let i = start; i < end; i++) {
      for (let j = i - 1; j >= start; j--) {
        if (await compare(arr[j], arr[j + 1]) < 0) break;
        await onSwap?.(arr[j], arr[j + 1]);
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
      }
    }
  }
}
