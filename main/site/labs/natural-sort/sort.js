import { Word2VecData } from "./data.js";

const data = new Word2VecData();

const isNode = typeof globalThis.process !== "undefined";
let anchorVecsRaw;
if (isNode) {
  const { readFileSync } = await import("fs");
  anchorVecsRaw = JSON.parse(readFileSync(new URL("./anchor-vecs.json", import.meta.url), "utf-8"));
} else {
  const resp = await fetch(new URL("./anchor-vecs.json", import.meta.url));
  anchorVecsRaw = await resp.json();
}
const anchorNames = Object.keys(anchorVecsRaw);
const anchorVecs = Object.values(anchorVecsRaw);

export async function wordSort(list) {
  list.forEach(item => {
    if (typeof item !== "string") throw new TypeError("strings only");
  });

  const vecs = await Promise.all(list.map(w => data.find(w, true)));
  vecs.forEach(v => normalize(v));

  const ranked = anchorVecs
    .map((anchorVec, i) => {
      const scores = vecs.map(v => dot(v, anchorVec));
      return { name: anchorNames[i], anchorVec, spread: Math.max(...scores) - Math.min(...scores) };
    })
    .sort((a, b) => b.spread - a.spread);
  const bestDirection = ranked[0];
  const orderVec = bestDirection.anchorVec;

  const mean = average(vecs);
  const centered = vecs.map(vec => subtract(vec.slice(), mean));
  const pc1 = powerIteration(centered);
  const pc2 = powerIteration(centered, [pc1]);
  const v1 = variance(centered, pc1);
  const v2 = variance(centered, pc2);
  const varianceRatio = v1 / v2;

  const orderProjections = {};
  vecs.forEach((v, i) => orderProjections[list[i]] = dot(orderVec, v));

  const linearProjections = {};
  vecs.forEach((v, i) => linearProjections[list[i]] = dot(pc1, v));

  const planarProjections = centered.map(v => ([
    dot(v, pc1),
    dot(v, pc2),
  ]));
  const magnitudes = planarProjections.map(p => Math.hypot(...p));
  const farthestIdx = magnitudes.indexOf(Math.max(...magnitudes));

  const angularProjections = {}
  vecs.forEach((v, i) => {
    let angle = Math.atan2(...subtract(planarProjections[i].slice(), planarProjections[farthestIdx]));
    // normalize to [0, 2π]
    if (angle < 0) angle += Math.PI * 2;
    angularProjections[list[i]] = angle;
  });

  const varianceThreshold = 1.3;
  const projections = orderProjections; // change
  const comparator = (a, b) => projections[a] - projections[b];
  return {
    comparator,
    toSorted: () => list.toSorted(comparator),
    sort: () => list.sort(comparator),
    direction: bestDirection.name,
    debug: {
      linearProjections,
      orderProjections,
      planarProjections,
      angularProjections,
    }
  }
}

function powerIteration(matrix, excludeVecs = [], iters = 50) {
  let vec = new Array(matrix[0].length).fill(0).map(() => Math.random() - 0.5);

  for (let i = 0; i < iters; i++) {
    // Xᵀ(Xv)
    const projected = matrix.map(row => dot(row, vec));
    let newVec = new Array(vec.length).fill(0);
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

function variance(vectors, dir) {
  const projected = vectors.map(v => dot(v, dir));
  return projected.reduce((sum, v) => sum + v * v, 0) / vectors.length;
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

function add(a, b) {
  const d = a.length;
  for (let i = 0; i < d; i++)
    a[i] += b[i];
  return a;
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
