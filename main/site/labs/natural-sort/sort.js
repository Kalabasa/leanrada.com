import { Word2VecData } from "./data.js";

const data = new Word2VecData();

const anchors = [
  // abstract order
  ["first", "last"],
  ["beginning", "end"],
  ["initial", "final"],
  ["start", "finish"],
  ["least", "most"],
  ["previous", "next"],

  // size
  ["smallest", "largest"],
  ["tiny", "huge"],
  ["minimum", "maximum"],
  ["narrow", "wide"],
  ["low", "high"],
  ["light", "heavy"],

  // time
  ["past", "future"],
  ["ancient", "modern"],
  ["dawn", "dusk"],
  ["yesterday", "tomorrow"],
  ["young", "old"],

  // specific sequences
  ["january", "december"],
  ["birth", "death"],
  ["alpha", "omega"],

  // rank
  ["worst", "best"],
  ["lowest", "highest"],
  ["weakest", "strongest"],
  ["slow", "fast"],
  ["coldest", "hottest"],
];

const anchorVecs = await Promise.all(
  anchors.map(async ([startWord, endWord]) =>
    subtract(...await Promise.all([
      data.find(endWord, true),
      data.find(startWord, true)
    ]))
  )
);

export async function wordSort(list) {
  list.forEach(item => {
    if (typeof item !== "string") throw new TypeError("strings only");
  });

  const vecs = await Promise.all(list.map(w => data.find(w, true)));

  const topAnchorVecs = anchorVecs
    .map(vec => {
      const scores = vecs.map(v => dot(v, vec));
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      return { vec, spread: max - min };
    })
    .sort((a, b) => b.spread - a.spread)
    .slice(0, 3)
    .map(x => x.vec);

  console.log("top anchorVecs");
  const orderVec = average(topAnchorVecs);
  for (let i = 0; i < anchors.length; i++) {
    if (topAnchorVecs.includes(anchorVecs[i])) {
      console.log('vec(', ...anchors[i], ') * avg(topAnchorVecs)', dot(anchorVecs[i], orderVec));
    }
  }
  normalize(orderVec);

  const mean = average(vecs);
  const centered = vecs.map(vec => subtract(vec.slice(), mean));
  const pc1 = powerIteration(centered);
  const pc2 = powerIteration(centered, [pc1]);
  const v1 = variance(centered, pc1);
  const v2 = variance(centered, pc2);
  const varianceRatio = v1 / v2;

  console.log("pc1 * pc2", dot(pc1, pc2));
  console.log("pc1 * orderVec", dot(pc1, orderVec));
  console.log("pc2 * orderVec", dot(pc2, orderVec));

  const linearProjections = {};
  vecs.forEach((v, i) => linearProjections[list[i]] = dot(orderVec, v));
  console.log("projected onto orderVec", linearProjections);

  const planarProjections = centered.map(v => ({
    x: dot(v, pc1),
    y: dot(v, pc2),
  }));
  const angularProjections = {}
  vecs.forEach((v, i) => angularProjections[list[i]] = Math.atan2(planarProjections[i].y, planarProjections[i].x));

  const varianceThreshold = 2;
  console.log({varianceRatio, varianceThreshold});
  const projections = varianceRatio > varianceThreshold ? linearProjections : angularProjections;
  console.log("using", projections === angularProjections ? "angular" : "linear", "projections");
  const comparator = (a, b) => projections[a] - projections[b];
  return {
    comparator,
    toSorted: () => list.toSorted(comparator),
    sort: () => list.sort(comparator),
  }
}

function powerIteration(matrix, excludeVecs = [], iters = 100) {
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
