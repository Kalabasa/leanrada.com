export function createQuickSort(callbacks) {
  const { onCompare, onSwap } = callbacks;

  async function compare(a, b) {
    await onCompare?.(a, b);
    return a.x - b.x;
  }

  async function partition(arr, start, end) {
    const mid = Math.floor((start + end) / 2);
    const pivot = arr[mid];

    let i = start;
    let j = end;

    while (true) {
      while ((await compare(arr[i], pivot)) < 0) i++;
      while ((await compare(arr[j], pivot)) > 0) j--;
      if (i >= j) return j;

      await onSwap?.(arr[i], arr[j]);
      [arr[i], arr[j]] = [arr[j], arr[i]];

      i++;
      j--;
    }
  }

  return async function quickSort(arr, start = 0, end = arr.length - 1) {
    if (end - start <= 0) return;

    const pivot = await partition(arr, start, end);
    await quickSort(arr, start, pivot);
    await quickSort(arr, pivot + 1, end);
  }
}
