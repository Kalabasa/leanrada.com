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
  ["coldest", "colder"],

  ["smile", "laugh"],
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
  console.group('wordSort');
  console.log(list);
  list.forEach(item => {
    if (typeof item !== "string") throw new TypeError("strings only");
  });

  const vecs = await Promise.all(list.map(w => data.find(w, true)));
  vecs.forEach(v => normalize(v));

  const topAnchorVecs = anchorVecs
    .map(anchorVec => {
      const scores = vecs.map(v => dot(v, anchorVec));
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      return { anchorVec, spread: max - min };
    })
    .sort((a, b) => b.spread - a.spread)
    .slice(0, 4)
    .map(o => o.anchorVec);

  console.group("top anchorVecs");
  const orderVec = average(topAnchorVecs);
  for (let i = 0; i < anchors.length; i++) {
    if (topAnchorVecs.includes(anchorVecs[i])) {
      console.log('vec(', ...anchors[i], ') * avg(topAnchorVecs)', dot(anchorVecs[i], orderVec));
    }
  }
  console.groupEnd();
  normalize(orderVec);

  const mean = average(vecs);
  const centered = vecs.map(vec => subtract(vec.slice(), mean));
  const pc1 = powerIteration(centered);
  const pc2 = powerIteration(centered, [pc1]);
  const v1 = variance(centered, pc1);
  const v2 = variance(centered, pc2);
  const varianceRatio = v1 / v2;

  console.log("pc1 * orderVec", dot(pc1, orderVec));
  console.log("pc2 * orderVec", dot(pc2, orderVec));

  const linearProjections = {};
  vecs.forEach((v, i) => linearProjections[list[i]] = dot(orderVec, v));
  console.log("linearProjections", linearProjections);

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
  console.log('angularProjections', angularProjections);

  // const greedyRank = greedySort(list, vecs, orderVec);

  const varianceThreshold = 1.3;
  console.log({varianceRatio, varianceThreshold});
  const projections = varianceRatio > varianceThreshold && Math.abs(dot(pc1, orderVec)) > 0.4
    ? linearProjections : angularProjections;
  console.log("using", projections === angularProjections ? "angular" : "linear", "projections");
  // const projections = greedyRank;
  const comparator = (a, b) => projections[a] - projections[b];
  console.log('>', list.toSorted(comparator));
  console.groupEnd();
  return {
    comparator,
    toSorted: () => list.toSorted(comparator),
    sort: () => list.sort(comparator),
    debug: {
      linearProjections,
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

function greedySort(list, vecs, orderVec) {
  const scores = vecs.map(v => dot(v, orderVec));
  const startIdx = scores.indexOf(Math.min(...scores));

  const visited = list.map(() => false);
  visited[startIdx] = true;
  const path = [startIdx];

  while (path.length < list.length) {
    const currentIdx = path.at(-1);
    let nearest = -1, minDist = Infinity;

    for (let i = 0; i < vecs.length; i++) {
      if (visited[i]) continue;
      const dist = dot(normalize(vecs[i].slice()), normalize(vecs[currentIdx].slice()));
      if (dist < minDist) { minDist = dist; nearest = i; }
    }

    visited[nearest] = true;
    path.push(nearest);
  }

  return Object.fromEntries(path.map((idx, rank) => [list[idx], rank]));
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
