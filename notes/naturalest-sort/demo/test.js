import { wordSort } from "./sort.js";

const cases = [
  { expected: ["past", "future"] },
  { expected: ["slow", "fast"] },
  { expected: ["weak", "strong"] },
  { expected: ["young", "old"] },
  { expected: ["narrow", "wide"] },
  { expected: ["shallow", "deep"] },
  { expected: ["soft", "hard"] },
  { expected: ["empty", "full"] },
  { expected: ["light", "heavy"] },
  { expected: ["poor", "rich"] },
  { expected: ["sad", "happy"] },
  { expected: ["worst", "best"] },
  { expected: ["less", "more"] },
  { expected: ["few", "many"] },
  { expected: ["minor", "major"] },
  { expected: ["below", "above"] },
  { expected: ["down", "up"] },
  { expected: ["failure", "success"] },
  { expected: ["smallest", "biggest"] },
  { expected: ["lowest", "highest"] },
  { expected: ["weakest", "strongest"] },
  { expected: ["slower", "faster"] },
  { expected: ["smaller", "larger"] },
  { expected: ["thinner", "thicker"] },
  { expected: ["easier", "harder"] },
  { expected: ["simpler", "complex"] },
  { expected: ["dull", "sharp"] },
  { expected: ["loose", "tight"] },
  { expected: ["plain", "fancy"] },
  { expected: ["asleep", "awake"] },
  { expected: ["low", "medium", "high"] },
  { expected: ["tiny", "small", "medium", "large", "huge"] },
  { expected: ["shallow", "medium", "deep"] },
  { expected: ["whisper", "talk", "shout", "scream"] },
  { expected: ["breeze", "wind", "gale", "storm"] },
  { expected: ["hate", "dislike", "like", "love"] },
  { expected: ["ugly", "plain", "pretty", "beautiful"] },
  { expected: ["horrible", "bad", "good", "wonderful"] },
  { expected: ["poor", "fair", "good", "excellent"] },
  { expected: ["crude", "decent", "refined", "elegant"] },
  { expected: ["boring", "interesting", "exciting"] },
  { expected: ["poverty", "comfort", "wealth"] },
  { expected: ["weak", "moderate", "strong"] },
  { expected: ["dull", "average", "sharp", "brilliant"] },
  { expected: ["beginning", "middle", "end"] },
  { expected: ["early", "middle", "late"] },
  { expected: ["dawn", "noon", "dusk"] },
  { expected: ["birth", "life", "death"] },
  { expected: ["rookie", "veteran", "legend"] },
  { expected: ["none", "few", "some", "many", "all"] },
  { expected: ["left", "center", "right"] },
  { expected: ["worst", "bad", "good", "best"] },
  { expected: ["village", "town", "city", "metropolis"] },
  { expected: ["path", "road", "highway"] },
  { expected: ["breeze", "wind", "gale", "storm"] },
  { expected: ["first", "second", "third", "fourth", "fifth"] },
  { expected: ["bronze", "silver", "gold"] },
  { anchorPair: ["smallest", "largest"], expected: ["tiny", "small", "medium", "large", "huge"] },
];

let passed = 0;
let failed = 0;
for (const item of cases) {
  const expected = item.expected;
  const sortOpts = {};
  if (item.anchorPair) sortOpts.anchorPair = item.anchorPair;
  const shuffled = expected.toSorted(() => Math.random() - 0.5);
  const result = await wordSort(shuffled, sortOpts);
  const sorted = result.toSorted();
  const correct = expected.every((w, i) => sorted[i] === w);
  const caseLabel = sorted.join(", ") + (item.anchorPair ? ` (${item.anchorPair.join("→")})` : "");
  if (correct) {
    passed++;
    console.log(`\x1b[32m  OK\x1b[39m ${caseLabel}`);
  } else {
    failed++;
    console.log(`\x1b[31mFAIL\x1b[39m ${caseLabel}`);
    console.log(`\x1b[33mWANT\x1b[39m ${expected.join(", ")}`);
  }
  if (globalThis.process?.env?.DEBUG) console.log(`direction=${result.projection.direction}`);
}
console.log(`${passed}/${cases.length}`);
