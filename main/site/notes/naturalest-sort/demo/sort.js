import { Word2VecData } from "./data.js";

const data = new Word2VecData();

export async function wordSort(list, { anchorPair, projectionType = "order" } = {}) {
  const vecs = await data.find(list);

  const projection = { values: {} };
  projection.type = projectionType;

  if (projectionType === "order") {
    let orderVec;
    if (anchorPair) {
      const [lowWord, highWord] = anchorPair;
      const [lowVec, highVec] = await data.find([lowWord, highWord]);
      orderVec = normalize(subtract(highVec.slice(), lowVec));
      projection.direction = `"${lowWord}" to "${highWord}"`;
    } else {
      const ranked = Object.entries(await getOrderVecs())
        .map(([name, anchorVec]) => {
          if (!Array.isArray(anchorVec)) return null;
          const scores = vecs.map(v => dot(v, anchorVec));
          return { name: name, anchorVec, spread: Math.max(...scores) - Math.min(...scores) };
        })
        .filter(Boolean)
        .sort((a, b) => b.spread - a.spread);
      orderVec = ranked[0].anchorVec;
      projection.direction = `'${ranked[0].name}' cluster vector`;
    }
    vecs.forEach((v, i) => projection.values[list[i]] = dot(orderVec, v));

    const mean = average(vecs);
    const centered = vecs.map(vec => subtract(vec.slice(), mean));
    const pc2 = powerIteration(centered, [orderVec]);
    const pc3 = powerIteration(centered, [orderVec, pc2]);
    projection.coords = Object.fromEntries(list.map((w, i) =>
      [w, [dot(centered[i], orderVec), dot(centered[i], pc2), dot(centered[i], pc3)]]
    ));
  } else {
    const mean = average(vecs);
    const centered = vecs.map(vec => subtract(vec.slice(), mean));
    const pc1 = powerIteration(centered);
    const pc2 = powerIteration(centered, [pc1]);
    const pc3 = powerIteration(centered, [pc1, pc2]);

    projection.coords = Object.fromEntries(list.map((w, i) =>
      [w, [dot(centered[i], pc1), dot(centered[i], pc2), dot(centered[i], pc3)]]
    ));

    if (projectionType === "principal") {
      vecs.forEach((v, i) => projection.values[list[i]] = dot(pc1, v));
      projection.direction = "PC1";
    } else if (projectionType === "angular") {
      const planar = list.map(w => [projection.coords[w][0], projection.coords[w][1]]);
      const magnitudes = planar.map(p => Math.hypot(...p));
      const farthestIdx = magnitudes.indexOf(Math.max(...magnitudes));
      const startAngle = Math.atan2(planar[farthestIdx][1], planar[farthestIdx][0]);
      list.forEach((w, i) => {
        let angle = Math.atan2(planar[i][1], planar[i][0]) - startAngle;
        if (angle < 0) angle += Math.PI * 2;
        projection.values[w] = angle;
      });
      projection.direction = "2D PCA polar coordinate";
    }
  }

  const comparator = (a, b) => projection.values[a] - projection.values[b];
  return {
    comparator,
    toSorted: () => list.toSorted(comparator),
    sort: () => list.sort(comparator),
    projection,
  }
}

const isNode = typeof globalThis.process !== "undefined";

let orderVecsPromise;

async function getOrderVecs() {
  if (orderVecsPromise) return orderVecsPromise;
  return orderVecsPromise = (async () => {
    if (isNode) {
      const { readFileSync } = await import("fs");
      return JSON.parse(readFileSync(new URL("./order-vecs.json", import.meta.url), "utf-8"));
    } else {
      const res = await fetch(new URL("./order-vecs.json", import.meta.url));
      return await res.json();
    }
  })();
}

function createRandom(seed) {
  // mulberry32
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function powerIteration(matrix, excludeVecs = [], iters = 50) {
  const rand = createRandom(42);
  let vec = matrix[0].map(() => rand() - 0.5);

  for (let i = 0; i < iters; i++) {
    // Xᵀ(Xv)
    const projected = matrix.map(row => dot(row, vec));
    let newVec = Array.from(vec, () => 0);
    for (let k = 0; k < matrix.length; k++)
      for (let j = 0; j < matrix[k].length; j++)
        newVec[j] += matrix[k][j] * projected[k];

    // deflate: remove components already found
    for (const prev of excludeVecs) {
      const d = dot(newVec, prev);
      newVec = newVec.map((v, j) => v - d * prev[j]);
    }

    vec = normalize(newVec);
  }

  return vec;
}

function average(vectors) {
  const n = vectors.length;
  const d = vectors[0].length;
  const result = Array.from({ length: d }, () => 0);
  for (const vec of vectors) {
    for (let j = 0; j < d; j++) {
      result[j] += vec[j] / n;
    }
  }
  return result;
}

function normalize(vec) {
  const norm = Math.hypot(...vec);
  vec.forEach((v, i) => vec[i] = v / norm);
  return vec;
}

function subtract(a, b) {
  const d = a.length;
  for (let i = 0; i < d; i++)
    a[i] -= b[i];
  return a;
}

function dot(a, b) {
  return a.reduce((sum, x, i) => sum + x * b[i], 0);
}
