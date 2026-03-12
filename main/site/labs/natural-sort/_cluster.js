import { Word2VecData } from "./data.js";

const data = new Word2VecData();
while (data.canLoadMore()) await data.loadMore();

const anchors = [
  ["first", "last"], ["beginning", "end"], ["initial", "final"],
  ["start", "finish"], ["least", "most"], ["previous", "next"],
  ["less", "more"],
  ["smallest", "largest"], ["tiny", "huge"], ["minimum", "maximum"],
  ["small", "big"], ["minor", "major"], ["narrow", "wide"],
  ["low", "high"], ["light", "heavy"], ["shallow", "deep"],
  ["weak", "strong"], ["mild", "extreme"], ["gentle", "fierce"],
  ["faint", "intense"], ["soft", "loud"], ["slow", "fast"],
  ["worst", "best"], ["lowest", "highest"],
  ["weakest", "strongest"], ["inferior", "superior"],
  ["poor", "excellent"],
  ["rare", "common"], ["scarce", "abundant"], ["few", "many"],
  ["cheap", "expensive"], ["worthless", "valuable"],
  ["terrible", "wonderful"], ["horrible", "amazing"],
  ["hatred", "love"],
];

const mustHave = [
  ["low", "medium", "high"],
  ["tiny", "small", "medium", "large", "huge"],
  ["worst", "bad", "good", "best"],
  ["terrible", "bad", "okay", "good", "great", "excellent"],
  ["hate", "dislike", "like", "love"],
  ["first", "second", "third", "fourth", "fifth"],
  ["never", "rarely", "often", "always"],
  ["none", "few", "some", "many", "all"],
  ["freezing", "cool", "warm", "hot"],
];
const niceToHave = [
  ["whisper", "talk", "shout", "scream"],
  ["bronze", "silver", "gold", "platinum"],
  ["village", "town", "city", "metropolis"],
  ["path", "road", "highway"],
  ["pond", "lake", "sea", "ocean"],
];

function sub(a, b) { return a.map((v, i) => v - b[i]); }
function norm(v) { const m = Math.sqrt(v.reduce((s, x) => s + x*x, 0)); return v.map(x => x / m); }
function dot(a, b) { return a.reduce((s, x, i) => s + x * b[i], 0); }
function avg(vecs) {
  const d = vecs[0].length;
  const r = Array(d).fill(0);
  for (const v of vecs) for (let i = 0; i < d; i++) r[i] += v[i] / vecs.length;
  return r;
}

const dirs = anchors.map(([a, b]) => norm(sub(data.get(b), data.get(a))));
const n = anchors.length;
const sim = Array.from({length: n}, (_, i) =>
  Array.from({length: n}, (_, j) => dot(dirs[i], dirs[j]))
);

function agglomerative(k) {
  const clusters = Array.from({length: n}, (_, i) => [i]);
  const active = new Set(Array.from({length: n}, (_, i) => i));
  function cSim(a, b) {
    let sum = 0, count = 0;
    for (const i of clusters[a]) for (const j of clusters[b]) { sum += sim[i][j]; count++; }
    return sum / count;
  }
  while (active.size > k) {
    let best = -Infinity, bA, bB;
    const arr = [...active];
    for (let i = 0; i < arr.length; i++)
      for (let j = i + 1; j < arr.length; j++) {
        const s = cSim(arr[i], arr[j]);
        if (s > best) { best = s; bA = arr[i]; bB = arr[j]; }
      }
    clusters[bA] = [...clusters[bA], ...clusters[bB]];
    active.delete(bB);
  }
  return [...active].map(idx => ({
    members: clusters[idx].map(i => anchors[i]),
    centroid: norm(avg(clusters[idx].map(i => dirs[i]))),
    representative: (() => {
      let bestRep = clusters[idx][0], bestAvg = -Infinity;
      for (const i of clusters[idx]) {
        const a = clusters[idx].reduce((s, j) => s + sim[i][j], 0) / clusters[idx].length;
        if (a > bestAvg) { bestAvg = a; bestRep = i; }
      }
      return anchors[bestRep];
    })(),
  }));
}

function testWithVecs(anchorVecs, topN) {
  function sortWords(words) {
    const vecs = words.map(w => norm(data.get(w).slice()));
    const scored = anchorVecs.map(av => {
      const scores = vecs.map(v => dot(v, av));
      return { av, spread: Math.max(...scores) - Math.min(...scores) };
    });
    scored.sort((a, b) => b.spread - a.spread);
    const top = Math.min(topN, scored.length);
    const orderVec = norm(avg(scored.slice(0, top).map(o => o.av)));
    const proj = {};
    vecs.forEach((v, i) => proj[words[i]] = dot(orderVec, v));
    return words.toSorted((a, b) => proj[a] - proj[b]);
  }

  let must = 0, nice = 0;
  for (const tc of mustHave) {
    const sorted = sortWords(tc);
    if (tc.every((w, i) => sorted[i] === w)) must++;
  }
  for (const tc of niceToHave) {
    const sorted = sortWords(tc);
    if (tc.every((w, i) => sorted[i] === w)) nice++;
  }
  return { must, nice, total: must + nice };
}

// Baseline
const fullVecs = anchors.map(([a, b]) => sub(data.get(b), data.get(a)));
const baseline = testWithVecs(fullVecs, 5);
console.log(`full(35) top5  must: ${baseline.must}/9  nice: ${baseline.nice}/5  total: ${baseline.total}/14`);
console.log();

// Cluster centroids at various k and topN
for (const k of [5, 6, 8, 10, 12]) {
  const clusters = agglomerative(k);
  const centroids = clusters.map(c => c.centroid);

  for (const topN of [1, 2, 3, Math.min(5, k)]) {
    const r = testWithVecs(centroids, topN);
    console.log(`k=${String(k).padEnd(2)} top${topN}     must: ${r.must}/9  nice: ${r.nice}/5  total: ${r.total}/14`);
  }
  console.log();
}

// Print cluster membership at k=8
console.log("=== Clusters at k=8 ===\n");
for (const c of agglomerative(8)) {
  const rep = `${c.representative[0]}→${c.representative[1]}`;
  const members = c.members.map(([a, b]) => `${a}→${b}`).join(", ");
  console.log(`Rep: ${rep}`);
  console.log(`  ${members}`);
  console.log();
}
