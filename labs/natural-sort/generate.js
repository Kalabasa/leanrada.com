import { Word2VecData } from "./data.js";
import { writeFileSync } from "fs";

const data = new Word2VecData();
while (data.canLoadMore()) await data.loadMore();
const anchors = [
  ["first", "last"], ["beginning", "end"], ["initial", "final"],
  ["start", "finish"], ["previous", "next"], ["before", "after"],
  ["early", "late"], ["opening", "closing"],
  ["least", "most"], ["less", "more"], ["few", "many"],
  ["minimum", "maximum"], ["none", "all"], ["partial", "total"],
  ["minority", "majority"], ["smallest", "largest"],
  ["tiny", "huge"], ["small", "big"], ["little", "great"],
  ["minor", "major"], ["miniature", "giant"], ["narrow", "wide"],
  ["short", "tall"], ["thin", "thick"], ["compact", "vast"],
  ["low", "high"], ["light", "heavy"], ["shallow", "deep"],
  ["sparse", "dense"], ["weak", "strong"],
  ["mild", "extreme"], ["gentle", "fierce"], ["faint", "intense"],
  ["soft", "hard"], ["calm", "violent"], ["tame", "wild"],
  ["moderate", "severe"], ["subtle", "obvious"], ["dim", "bright"],
  ["dull", "sharp"], ["pale", "vivid"], ["slow", "fast"],
  ["sluggish", "rapid"], ["gradual", "sudden"], ["soft", "loud"],
  ["quiet", "noisy"], ["silent", "deafening"], ["whisper", "roar"],
  ["cold", "hot"], ["cool", "warm"], ["frozen", "boiling"],
  ["icy", "burning"], ["worst", "best"], ["lowest", "highest"],
  ["weakest", "strongest"], ["inferior", "superior"], ["poor", "excellent"],
  ["poverty", "wealth"], ["basic", "advanced"], ["amateur", "professional"],
  ["novice", "expert"], ["ordinary", "extraordinary"], ["young", "old"],
  ["new", "ancient"], ["modern", "traditional"], ["recent", "distant"],
  ["fresh", "stale"], ["rare", "common"], ["scarce", "abundant"],
  ["never", "always"], ["seldom", "often"], ["occasional", "frequent"],
  ["unusual", "typical"], ["cheap", "expensive"], ["worthless", "valuable"],
  ["free", "costly"], ["affordable", "luxurious"], ["terrible", "wonderful"],
  ["horrible", "amazing"], ["hatred", "love"], ["sad", "happy"],
  ["miserable", "joyful"], ["ugly", "beautiful"], ["boring", "exciting"],
  ["disgusting", "delightful"], ["painful", "pleasant"], ["fear", "courage"],
  ["despair", "hope"], ["failure", "success"], ["defeat", "victory"],
  ["easy", "difficult"], ["simple", "complex"], ["trivial", "challenging"],
  ["effortless", "strenuous"], ["uncertain", "certain"], ["doubtful", "confident"],
  ["impossible", "inevitable"], ["unlikely", "likely"], ["empty", "full"],
  ["vacant", "occupied"], ["barren", "fertile"], ["dry", "wet"],
  ["plain", "elaborate"], ["crude", "refined"], ["rough", "smooth"],
  ["raw", "polished"], ["specific", "general"], ["particular", "universal"],
  ["individual", "collective"], ["private", "public"], ["hidden", "visible"],
  ["secret", "known"], ["internal", "external"], ["inner", "outer"],
  ["bottom", "top"], ["under", "over"], ["below", "above"],
  ["behind", "front"], ["back", "forward"], ["left", "right"],
  ["down", "up"], ["west", "east"], ["south", "north"],
  ["rural", "urban"], ["local", "global"], ["domestic", "foreign"],
  ["negative", "positive"], ["static", "dynamic"], ["active", "passive"],
  ["dead", "alive"], ["temporary", "permanent"], ["fake", "real"],
  ["false", "true"], ["wrong", "right"], ["evil", "good"],
  ["guilty", "innocent"], ["cruel", "kind"], ["rude", "polite"],
  ["messy", "neat"], ["dirty", "clean"], ["loose", "tight"],
  ["closed", "open"], ["off", "on"], ["asleep", "awake"]
];

function sub(a, b) { return a.map((v, i) => v - b[i]); }
function norm(v) { const m = Math.sqrt(v.reduce((s, x) => s + x * x, 0)); return v.map(x => x / m); }
function dot(a, b) { return a.reduce((s, x, i) => s + x * b[i], 0); }
function avg(vecs) {
  const d = vecs[0].length;
  const r = Array(d).fill(0);
  for (const v of vecs) for (let i = 0; i < d; i++) r[i] += v[i] / vecs.length;
  return r;
}

const validAnchors = anchors.filter(([a, b]) => data.get(a) && data.get(b));
const skipped = anchors.filter(([a, b]) => !data.get(a) || !data.get(b));
if (skipped.length) {
  console.log(`Skipped ${skipped.length} pairs (not in vocab):`);
  for (const [a, b] of skipped) {
    const missing = [!data.get(a) && a, !data.get(b) && b].filter(Boolean);
    console.log(`  ${a}→${b} (missing: ${missing.join(", ")})`);
  }
  console.log();
}

const dirs = validAnchors.map(([a, b]) => norm(sub(data.get(b), data.get(a))));
const n = validAnchors.length;
const sim = Array.from({ length: n }, (_, i) =>
  Array.from({ length: n }, (_, j) => dot(dirs[i], dirs[j]))
);

// Agglomerative clustering (average linkage) down to k=10
const k = parseInt(process.argv[2]);
const clusters = Array.from({ length: n }, (_, i) => [i]);
const active = new Set(Array.from({ length: n }, (_, i) => i));

function clusterSim(a, b) {
  let sum = 0, count = 0;
  for (const i of clusters[a])
    for (const j of clusters[b]) { sum += sim[i][j]; count++; }
  return sum / count;
}

while (active.size > k) {
  let best = -Infinity, bA, bB;
  const arr = [...active];
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++) {
      const s = clusterSim(arr[i], arr[j]);
      if (s > best) { best = s; bA = arr[i]; bB = arr[j]; }
    }
  clusters[bA] = [...clusters[bA], ...clusters[bB]];
  active.delete(bB);
}

const allClusters = [...active].map(idx => {
  const memberDirs = clusters[idx].map(i => dirs[i]);
  const centroid = norm(avg(memberDirs));
  const members = clusters[idx].map(i => validAnchors[i]);
  return { members, centroid };
});

allClusters.sort((a, b) => b.members.length - a.members.length);

const minSize = 8;
const bigClusters = allClusters.filter(c => c.members.length >= minSize);

console.log(`${validAnchors.length} valid anchors → ${allClusters.length} clusters (${bigClusters.length} with ${minSize}+ members)\n`);

for (const { members } of allClusters) {
  const big = members.length >= minSize;
  const labels = members.map(([a, b]) => `${a}→${b}`).join(", ");
  console.log(`  ${big ? ">>>" : "   "} [${members.length}] ${labels}`);
}

const nameByPair = {
  polarity:  ["worst", "best"],
  magnitude: ["tiny", "huge"],
  frequency: ["rare", "common"],
  sequence:  ["first", "last"],
};
const output = {};
for (const [name, pair] of Object.entries(nameByPair)) {
  const cluster = bigClusters.find(c =>
    c.members.some(([a, b]) => a === pair[0] && b === pair[1])
  );
  if (!cluster) throw new Error(`No cluster found containing ${pair}`);
  output[name] = cluster.centroid;
}
writeFileSync("anchor-vecs.json", JSON.stringify(output, null, 2));
console.log(`\nWrote ${Object.keys(output).length} named anchor vecs to anchor-vecs.json`);
