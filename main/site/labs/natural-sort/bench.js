import { wordSort } from "./sort.js";

const mustHave = [
  // scales everyone would agree on
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
  // sortable but less obvious
  ["whisper", "talk", "shout", "scream"],
  ["bronze", "silver", "gold", "platinum"],
  ["village", "town", "city", "metropolis"],
  ["path", "road", "highway"],
  ["pond", "lake", "sea", "ocean"],
];

async function run(label, cases) {
  let passed = 0;
  let failed = 0;
  for (const expected of cases) {
    const shuffled = expected.toSorted(() => Math.random() - 0.5);
    const result = await wordSort(shuffled);
    const sorted = result.toSorted();
    const correct = expected.every((w, i) => sorted[i] === w);
    if (correct) {
      passed++;
      console.log(`  ok  ${expected.join(', ')}`);
    } else {
      failed++;
      console.log(`  FAIL  ${expected.join(', ')}`);
      console.log(`        ${sorted.join(', ')}`);
    }
  }
  console.log(`${label}: ${passed}/${cases.length}`);
  return { passed, total: cases.length };
}

console.log("=== MUST HAVE ===");
const must = await run("must", mustHave);
console.log("\n=== NICE TO HAVE ===");
const nice = await run("nice", niceToHave);
console.log(`\nTotal: ${must.passed + nice.passed}/${must.total + nice.total}  (must: ${must.passed}/${must.total}, nice: ${nice.passed}/${nice.total})`);
